namespace Etl.EsBulkLoad

// =============================================================================
//  Elasticsearch BULK LOAD sink â€” initial backfill, NO CDC.
//
//  This is the throughput sibling of the CDC sink. It deliberately drops the
//  CDC machinery and adds the load machinery:
//
//    CDC sink                          | Bulk-load sink (this file)
//    ----------------------------------|------------------------------------
//    SCN external-versioning           | none â€” empty index, nothing to gate
//    409 = Superseded (idempotent)     | 409 = AlreadyPresent (resumable skip)
//    one txn -> one request            | chunk by doc-count AND byte budget
//    one request, caller replays       | bounded in-flight window + 429 retry
//    per-DOC Writer lineage            | per-CHUNK Writer lineage (right scale)
//    one bad row fails the whole txn   | bad rows collected, load continues
//
//  Idempotent re-runs: deterministic DocId + op_type=create. Re-running a
//  half-finished load skips already-present docs (409) for free â€” so a crash
//  is recovered by simply re-running (optionally resuming from a checkpoint).
//
//  Shape: functional core, imperative shell.
//    pure leaves : planRow, encodeDoc, chunkByBudget, parse, classify, tally
//    effect edge : BulkTransport.Post (the ONLY I/O), IndexAdmin (settings)
//    shell       : runDriver streams rows -> chunks -> bounded waves
//
//  Discipline: parse-don't-validate; types-as-proofs; closed DUs; Result over
//  exceptions (exceptions converted ONLY at interop edges, flagged âš ); Writer
//  monad for telemetry-as-lineage; FsCheck/Expecto property tests at the foot.
//
//  NuGet: FsToolkit.ErrorHandling, FsCheck, Expecto (tests). Target net10.0, ES 9.x.
// =============================================================================

module Domain =

    open System

    type PlanError =
        | EmptyDocId
        | InvalidIndex of reason: string
        | RenderFailed of field: string * reason: string
        | IdDerivationFailed of reason: string

    /// Deterministic document identity â€” derived from the source key. This is the
    /// load's idempotency anchor: same row -> same _id -> create is a safe no-op.
    type DocId = private DocId of string
    module DocId =
        let create (s: string) : Result<DocId, PlanError> =
            if String.IsNullOrWhiteSpace s then Error EmptyDocId else Ok (DocId (s.Trim()))
        let value (DocId s) = s

    type IndexName = private IndexName of string
    module IndexName =
        let create (s: string) : Result<IndexName, PlanError> =
            if String.IsNullOrWhiteSpace s then Error (InvalidIndex "empty")
            elif s <> s.ToLowerInvariant() then Error (InvalidIndex "must be lowercase")
            elif s.StartsWith "_" || s.StartsWith "-" then Error (InvalidIndex "bad leading char")
            else Ok (IndexName s)
        let value (IndexName s) = s


module Plan =

    open Domain
    open FsToolkit.ErrorHandling

    /// CreateIfAbsent -> op_type=create: idempotent, resumable, 409-on-dup.
    /// Overwrite      -> op_type=index : last-write-wins, no dup detection.
    type WriteMode = CreateIfAbsent | Overwrite

    /// Phantom 'doc binds a plan to one document family.
    type IndexDoc<'doc> = { Id: DocId; Body: 'doc }

    /// Shared, DECLARATIVE mapping â€” the same record the batch path already uses.
    /// Pure. No delete branch: a backfill never retires anything.
    type Projection<'src, 'doc> =
        { DocId  : 'src -> Result<DocId, PlanError>
          Render : 'src -> Result<'doc,  PlanError> }

    /// Plan ONE row. On a backfill a malformed row is collected and skipped â€” it
    /// must NOT abort a billion-row load (the opposite of the CDC txn rule).
    let planRow (p: Projection<'src, 'doc>) (src: 'src) : Result<IndexDoc<'doc>, PlanError> =
        result {
            let! id   = p.DocId src
            let! body = p.Render src
            return { Id = id; Body = body }
        }


module Wire =

    open System.Text
    open System.Text.Json
    open Domain
    open Plan

    type NdjsonBody = NdjsonBody of string

    /// 'doc -> compact single-line JSON (FsCodec / System.Text.Json).
    type DocEncoder<'doc> = 'doc -> string

    /// One doc's full NDJSON contribution (action line + source line), with its
    /// UTF-8 byte length precomputed so the chunker can budget by bytes. Keeping
    /// the per-doc unit lets the runner rebuild a retry sub-batch by index.
    type Encoded = { Id: string; Lines: string; Bytes: int }

    // No version / version_type fields: this is a first-time load into (ideally)
    // an empty index.
    let private actionLine mode (idx: string) (id: string) =
        match mode with
        | CreateIfAbsent -> JsonSerializer.Serialize {| create = {| _index = idx; _id = id |} |}
        | Overwrite      -> JsonSerializer.Serialize {| index  = {| _index = idx; _id = id |} |}

    /// Pure: encode one doc to its two-line unit.
    /// âš  Windows gotcha: _bulk needs '\n' delimiters + a trailing newline, NOT
    ///   Environment.NewLine ("\r\n"). Each unit ends in '\n', so concatenating
    ///   units yields a valid, correctly-terminated body.
    let encodeDoc mode (index: IndexName) (enc: DocEncoder<'doc>) (d: IndexDoc<'doc>) : Encoded =
        let idx = IndexName.value index
        let id  = DocId.value d.Id
        let lines = actionLine mode idx id + "\n" + enc d.Body + "\n"
        { Id = id; Lines = lines; Bytes = Encoding.UTF8.GetByteCount lines }

    let bodyOf (units: Encoded[]) : NdjsonBody =
        units |> Array.map (fun u -> u.Lines) |> String.concat "" |> NdjsonBody

    /// One bulk request worth of docs. Carries the per-doc units (not just the
    /// concatenated body) so the runner can re-send only the rejected subset.
    type Chunk = { Seq: int; Units: Encoded[]; Bytes: int }

    /// Pure, LAZY: pack a unit stream into chunks honouring BOTH a doc-count cap
    /// and a byte budget. Greedy; never splits a doc (a single oversized doc gets
    /// its own chunk). Bounded memory: one chunk in flight at a time.
    /// âš  The accumulators are mutable locals confined to this generator â€” the
    ///   standard idiom for a stateful lazy transform; nothing escapes.
    let chunkByBudget (maxDocs: int) (maxBytes: int) (units: Encoded seq) : Chunk seq =
        seq {
            let cur = ResizeArray<Encoded>()
            let mutable bytes = 0
            let mutable sq = 0
            for u in units do
                let wouldExceed =
                    cur.Count > 0 && (cur.Count >= maxDocs || bytes + u.Bytes > maxBytes)
                if wouldExceed then
                    yield { Seq = sq; Units = cur.ToArray(); Bytes = bytes }
                    sq <- sq + 1
                    cur.Clear()
                    bytes <- 0
                cur.Add u
                bytes <- bytes + u.Bytes
            if cur.Count > 0 then
                yield { Seq = sq; Units = cur.ToArray(); Bytes = bytes }
        }


module Telemetry =

    open Domain
    open Wire

    type DocFault = { Id: string; Status: int; Reason: string }

    /// Per-chunk result, accumulated across retry attempts.
    type ChunkOutcome =
        { Seq: int
          Created: int
          AlreadyPresent: int
          Overwritten: int
          Faults: DocFault list
          Attempts: int
          ElapsedMs: int64 }
    module ChunkOutcome =
        let zero seq = { Seq = seq; Created = 0; AlreadyPresent = 0; Overwritten = 0
                         Faults = []; Attempts = 1; ElapsedMs = 0L }

    /// Aggregate, end-of-load report.
    type LoadReport =
        { Chunks: int
          Docs: int
          Created: int
          AlreadyPresent: int
          Overwritten: int
          Retries: int
          PlanFaults: int
          PlanFaultSamples: PlanError list
          Faults: DocFault list
          ElapsedMs: int64 }
    module LoadReport =
        let empty =
            { Chunks = 0; Docs = 0; Created = 0; AlreadyPresent = 0; Overwritten = 0
              Retries = 0; PlanFaults = 0; PlanFaultSamples = []; Faults = []; ElapsedMs = 0L }
        /// Fold one chunk outcome in. Wall time is measured once at the end, not here.
        let add (r: LoadReport) (o: ChunkOutcome) =
            { r with
                Chunks         = r.Chunks + 1
                Docs           = r.Docs + o.Created + o.AlreadyPresent + o.Overwritten + List.length o.Faults
                Created        = r.Created + o.Created
                AlreadyPresent = r.AlreadyPresent + o.AlreadyPresent
                Overwritten    = r.Overwritten + o.Overwritten
                Retries        = r.Retries + max 0 (o.Attempts - 1)
                Faults         = r.Faults @ o.Faults }
        let addPlanFault (r: LoadReport) (pe: PlanError) =
            { r with
                PlanFaults = r.PlanFaults + 1
                PlanFaultSamples =
                    if List.length r.PlanFaultSamples < 20
                    then r.PlanFaultSamples @ [ pe ] else r.PlanFaultSamples }
        /// CLEAN = every source row reached a terminal-good state: no doc faults
        /// AND no rows dropped at plan time. This is the bulk-load analogue of the
        /// CDC sink's "settled" checkpoint gate.
        let clean (r: LoadReport) = List.isEmpty r.Faults && r.PlanFaults = 0


module Lineage =

    open Telemetry

    /// One entry PER CHUNK â€” telemetry-as-lineage at the granularity that makes
    /// sense for a backfill (a billion per-doc entries would be self-harm).
    type LineageEntry =
        { Chunk: int; Docs: int; Created: int; AlreadyPresent: int
          Overwritten: int; Faulted: int; Attempts: int; ElapsedMs: int64 }

    let entryOf (o: ChunkOutcome) : LineageEntry =
        { Chunk = o.Seq; Docs = o.Created + o.AlreadyPresent + o.Overwritten + List.length o.Faults
          Created = o.Created; AlreadyPresent = o.AlreadyPresent; Overwritten = o.Overwritten
          Faulted = List.length o.Faults; Attempts = o.Attempts; ElapsedMs = o.ElapsedMs }

    /// Writer over the free monoid of lineage entries.
    /// âš  PERF: bind appends (w1 @ w2). Per-chunk counts are small, and the shell
    ///   runs the Writer per-WAVE then drains into a ResizeArray, so the append is
    ///   never quadratic over the whole load. Swap to a difference-list carrier if
    ///   you ever fold all chunks through a single Writer.
    type Lineage<'a> = Lineage of 'a * LineageEntry list
    let run  (Lineage (a, w)) = a, w
    let ret  a = Lineage (a, [])
    let tell w = Lineage ((), w)
    let bind f (Lineage (a, w1)) =
        let (Lineage (b, w2)) = f a in Lineage (b, w1 @ w2)
    type LineageBuilder () =
        member _.Return x        = ret x
        member _.Bind (m, f)     = bind f m
        member _.Zero ()         = ret ()
        member _.Delay f         = f ()
    let lineage = LineageBuilder ()

    /// Thread one chunk outcome through the Writer: log its entry, fold its counts.
    let tellChunk (o: ChunkOutcome) (r: LoadReport) : Lineage<LoadReport> =
        lineage {
            do! tell [ entryOf o ]
            return LoadReport.add r o
        }


module Run =

    open System
    open System.Diagnostics
    open System.Text.Json
    open Domain
    open Plan
    open Wire
    open Telemetry

    type TransportError =
        | TooManyRequests
        | Timeout
        | Network  of string
        | BadStatus of code: int * body: string

    type RawBulkResponse = RawBulkResponse of json: string

    /// The ONLY I/O the load depends on. Adapter wraps the ES low-level transport
    /// or a bare HttpClient POST to /_bulk.
    type BulkTransport = { Post : NdjsonBody -> Async<Result<RawBulkResponse, TransportError>> }

    /// Index settings orchestration (separate ES endpoints). Supply adapters; the
    /// recommended bodies live in module Tuning below. `noop` for untuned loads.
    type IndexAdmin =
        { ApplyLoadSettings : IndexName -> Async<Result<unit, TransportError>>
          RestoreSettings   : IndexName -> Async<Result<unit, TransportError>>
          Refresh           : IndexName -> Async<Result<unit, TransportError>> }
    module IndexAdmin =
        let private ok _ = async { return Ok () }
        let noop = { ApplyLoadSettings = ok; RestoreSettings = ok; Refresh = ok }

    type RetryPolicy = { MaxAttempts: int; BaseDelayMs: int; MaxDelayMs: int; Jitter: bool }
    module RetryPolicy =
        let standard = { MaxAttempts = 5; BaseDelayMs = 500; MaxDelayMs = 30_000; Jitter = true }

    type LoadConfig =
        { MaxDocsPerChunk: int
          MaxBytesPerChunk: int
          MaxInFlight: int
          Retry: RetryPolicy
          Mode: WriteMode
          TuneIndex: bool }
    module LoadConfig =
        /// Sensible starting point: ~5 MB chunks, 4 requests in flight, create-idempotent.
        let recommended =
            { MaxDocsPerChunk = 5_000
              MaxBytesPerChunk = 5 * 1024 * 1024
              MaxInFlight = 4
              Retry = RetryPolicy.standard
              Mode = CreateIfAbsent
              TuneIndex = true }

    type LoadError = AdminFailed of string

    // ---- pure: response parsing (never throws inward) ------------------------
    type BulkItemResult =
        { Status: int; Result: string option; ErrorType: string option }

    let parse (RawBulkResponse json) : Result<BulkItemResult[], TransportError> =
        try
            use doc = JsonDocument.Parse json
            let items = doc.RootElement.GetProperty "items"
            let getStr (el: JsonElement) name =
                match el.TryGetProperty name with
                | true, v when v.ValueKind = JsonValueKind.String -> Some (v.GetString())
                | _ -> None
            let parsed =
                [| for itemEl in items.EnumerateArray() do
                     let body = (itemEl.EnumerateObject() |> Seq.head).Value
                     let status = match body.TryGetProperty "status" with | true, v -> v.GetInt32() | _ -> -1
                     let err =
                         match body.TryGetProperty "error" with
                         | true, e -> (getStr e "type") |> Option.orElse (Some "error")
                         | _ -> None
                     yield { Status = status; Result = getStr body "result"; ErrorType = err } |]
            Ok parsed
        with ex ->
            // âš  Sanctioned exception boundary: STJ throws on malformed input; we
            //   convert to Result here and let nothing propagate inward.
            Error (BadStatus (-1, ex.Message))

    // ---- pure: per-doc classification ----------------------------------------
    type private DocClass =
        | Created | AlreadyPresent | Overwritten | Retry | Hard of DocFault

    let private classifyItem mode (u: Encoded) (it: BulkItemResult) : DocClass =
        match mode, it.Status, it.ErrorType with
        | _,               429, _      -> Retry                       // ES backpressure on this item
        | CreateIfAbsent,  201, _      -> Created
        | CreateIfAbsent,  409, _      -> AlreadyPresent              // resumable idempotency
        | Overwrite,       (200 | 201), _ -> Overwritten
        | _,               s,   Some e -> Hard { Id = u.Id; Status = s; Reason = e }
        | _,               s,   None   -> Hard { Id = u.Id; Status = s; Reason = "unclassified" }

    let private tally (acc: ChunkOutcome) = function
        | Created        -> { acc with Created = acc.Created + 1 }
        | AlreadyPresent -> { acc with AlreadyPresent = acc.AlreadyPresent + 1 }
        | Overwritten    -> { acc with Overwritten = acc.Overwritten + 1 }
        | Hard f         -> { acc with Faults = f :: acc.Faults }
        | Retry          -> acc   // carried forward to the next attempt

    // ---- effect: send one chunk, retrying ONLY the rejected subset -----------
    let private isRetryable = function
        | TooManyRequests | Timeout | Network _ -> true
        | BadStatus (503, _) | BadStatus (429, _) -> true
        | BadStatus _ -> false

    let private backoffMs (p: RetryPolicy) (attempt: int) =
        let expo = float p.BaseDelayMs * (2.0 ** float (attempt - 1))
        let capped = min (float p.MaxDelayMs) expo
        let jitter = if p.Jitter then Random.Shared.NextDouble() * capped * 0.2 else 0.0
        int (capped + jitter)

    let sendChunkWithRetry (transport: BulkTransport) (mode: WriteMode) (policy: RetryPolicy)
                           (chunk: Chunk) : Async<ChunkOutcome> =
        let sw = Stopwatch.StartNew ()
        let rec attemptLoop attempt (units: Encoded[]) (acc: ChunkOutcome) : Async<ChunkOutcome> =
            async {
                match! transport.Post (Wire.bodyOf units) with
                | Error te when isRetryable te && attempt < policy.MaxAttempts ->
                    do! Async.Sleep (backoffMs policy attempt)
                    return! attemptLoop (attempt + 1) units { acc with Attempts = attempt + 1 }
                | Error te ->
                    // whole request failed terminally -> every unit here is a fault
                    let st = match te with BadStatus (c, _) -> c | _ -> -1
                    let faults =
                        units |> Array.toList
                              |> List.map (fun u -> { Id = u.Id; Status = st; Reason = sprintf "%A" te })
                    return { acc with Faults = acc.Faults @ faults; Attempts = attempt }
                | Ok raw ->
                    match parse raw with
                    | Error te ->
                        let faults = units |> Array.toList |> List.map (fun u -> { Id = u.Id; Status = -1; Reason = sprintf "%A" te })
                        return { acc with Faults = acc.Faults @ faults; Attempts = attempt }
                    | Ok items when items.Length <> units.Length ->
                        // arity mismatch is a protocol violation â€” fault the batch, do not guess
                        let faults = units |> Array.toList |> List.map (fun u -> { Id = u.Id; Status = -1; Reason = "bulk arity mismatch" })
                        return { acc with Faults = acc.Faults @ faults; Attempts = attempt }
                    | Ok items ->
                        let classes = Array.map2 (classifyItem mode) units items
                        let acc' = Array.fold tally acc classes
                        let retryIdx =
                            classes |> Array.mapi (fun i c -> i, c)
                                    |> Array.choose (fun (i, c) -> match c with Retry -> Some i | _ -> None)
                        if retryIdx.Length = 0 then
                            return { acc' with Attempts = attempt }
                        elif attempt < policy.MaxAttempts then
                            do! Async.Sleep (backoffMs policy attempt)
                            let sub = retryIdx |> Array.map (fun i -> units.[i])
                            return! attemptLoop (attempt + 1) sub { acc' with Attempts = attempt + 1 }
                        else
                            let faults =
                                retryIdx |> Array.toList
                                         |> List.map (fun i -> { Id = units.[i].Id; Status = 429; Reason = "retries exhausted" })
                            return { acc' with Faults = acc'.Faults @ faults; Attempts = attempt }
            }
        async {
            let! r = attemptLoop 1 chunk.Units (ChunkOutcome.zero chunk.Seq)
            sw.Stop ()
            return { r with ElapsedMs = sw.ElapsedMilliseconds }
        }


module Tuning =
    /// Apply BEFORE load: disable refresh + replicas for max indexing throughput.
    let loadSettings = """{"index":{"refresh_interval":"-1","number_of_replicas":0}}"""
    /// Apply AFTER load: restore refresh + replicas (pick your steady-state replica count).
    let restoreSettings replicas =
        sprintf """{"index":{"refresh_interval":"1s","number_of_replicas":%d}}""" replicas


module Driver =

    open System.Diagnostics
    open Domain
    open Plan
    open Wire
    open Telemetry
    open Lineage
    open Run

    /// IMPERATIVE SHELL. Streams rows -> plan (pure) -> encode (pure) -> pack into
    /// chunks (pure rule) -> dispatch bounded WAVES of â‰¤ MaxInFlight chunks in
    /// parallel (effect) -> fold via Writer (pure). Bounded memory throughout:
    /// at most MaxInFlight chunks materialised at once. Plan faults are collected,
    /// never fatal. âš  The locals below are confined to this shell.
    let private runDriver (transport: BulkTransport) (index: IndexName)
                          (proj: Projection<'src, 'doc>) (enc: DocEncoder<'doc>)
                          (cfg: LoadConfig)
                          (progress: (ChunkOutcome -> Async<unit>) option)
                          (rows: 'src seq)
        : Async<LoadReport * LineageEntry list> =
        async {
            let entries = ResizeArray<LineageEntry> ()
            let mutable report = LoadReport.empty
            let cur = ResizeArray<Encoded> ()
            let mutable curBytes = 0
            let mutable nextSeq = 0
            let wave = ResizeArray<Chunk> ()
            let sw = Stopwatch.StartNew ()

            let closeChunk () =
                if cur.Count > 0 then
                    wave.Add { Seq = nextSeq; Units = cur.ToArray(); Bytes = curBytes }
                    nextSeq <- nextSeq + 1
                    cur.Clear ()
                    curBytes <- 0

            let dispatchWave () =
                async {
                    if wave.Count > 0 then
                        let! outs =
                            wave
                            |> Seq.map (Run.sendChunkWithRetry transport cfg.Mode cfg.Retry)
                            |> Async.Parallel
                        // fold the wave through the Writer, then drain into the shell buffer
                        let rep', es =
                            outs
                            |> Array.fold (fun m o -> Lineage.bind (Lineage.tellChunk o) m) (Lineage.ret report)
                            |> Lineage.run
                        report <- rep'
                        entries.AddRange es
                        match progress with
                        | Some f -> for o in outs do do! f o
                        | None -> ()
                        wave.Clear ()
                }

            use e = rows.GetEnumerator ()
            while e.MoveNext () do
                match Plan.planRow proj e.Current with
                | Error pe ->
                    report <- LoadReport.addPlanFault report pe
                | Ok d ->
                    let u = Wire.encodeDoc cfg.Mode index enc d
                    if cur.Count > 0 && (cur.Count >= cfg.MaxDocsPerChunk || curBytes + u.Bytes > cfg.MaxBytesPerChunk) then
                        closeChunk ()
                        if wave.Count >= cfg.MaxInFlight then do! dispatchWave ()
                    cur.Add u
                    curBytes <- curBytes + u.Bytes

            closeChunk ()
            do! dispatchWave ()
            sw.Stop ()
            return { report with ElapsedMs = sw.ElapsedMilliseconds }, List.ofSeq entries
        }

    /// Top-level entry point: optional index tuning -> stream load -> restore.
    /// `rows` MUST be lazy (a DuckDB/Parquet reader sequence) so the firehose is
    /// never materialised. `progress` lets you checkpoint chunk-by-chunk into
    /// DuckDB/Oracle for skip-ahead resume; create-idempotency makes naive full
    /// re-run safe even without it.
    let ingest (admin: IndexAdmin) (transport: BulkTransport) (index: IndexName)
               (proj: Projection<'src, 'doc>) (enc: DocEncoder<'doc>)
               (cfg: LoadConfig)
               (progress: (ChunkOutcome -> Async<unit>) option)
               (rows: 'src seq)
        : Async<Result<LoadReport * LineageEntry list, LoadError>> =
        async {
            if cfg.TuneIndex then
                match! admin.ApplyLoadSettings index with
                | Error e -> return Error (AdminFailed (sprintf "apply load settings: %A" e))
                | Ok () ->
                    let! result = runDriver transport index proj enc cfg progress rows
                    // best-effort: never let a settings restore failure mask the load report
                    do! admin.RestoreSettings index |> Async.Ignore
                    do! admin.Refresh index |> Async.Ignore
                    return Ok result
            else
                let! result = runDriver transport index proj enc cfg progress rows
                return Ok result
        }


// =============================================================================
//  Property tests â€” FsCheck via Expecto.
// =============================================================================
module Tests =

    open Expecto
    open FsCheck
    open Wire
    open Telemetry
    open Run

    let private genUnit : Gen<Encoded> =
        gen {
            let! n   = Gen.choose (1, 50)
            let! len = Gen.choose (10, 400)
            let lines = String.replicate len "x"
            return { Id = sprintf "id%d" n; Lines = lines; Bytes = lines.Length }
        }

    [<Tests>]
    let suite =
        testList "EsBulkLoad" [

            test "chunkByBudget: conserves docs, preserves order, respects caps" {
                let prop =
                    Prop.forAll (Arb.fromGen (Gen.listOf genUnit)) (fun units ->
                        let maxDocs, maxBytes = 7, 1000
                        let chunks = Wire.chunkByBudget maxDocs maxBytes units |> List.ofSeq
                        let flat = chunks |> List.collect (fun c -> List.ofArray c.Units)
                        let conserved = flat = units                       // count + ORDER
                        let capsOk =
                            chunks |> List.forall (fun c ->
                                // either within both caps, or a single doc that alone blows the byte cap
                                c.Units.Length <= maxDocs
                                && (c.Bytes <= maxBytes || c.Units.Length = 1))
                        conserved && capsOk)
                Check.QuickThrowOnFailure prop
            }

            test "classify (create mode): outcomes partition the chunk; retries excluded from terminal counts" {
                // build matched (unit, item) pairs with assorted statuses
                let genPair =
                    gen {
                        let! u = genUnit
                        let! status = Gen.elements [ 201; 409; 429; 400 ]
                        let err = match status with 400 -> Some "mapper_parsing_exception" | _ -> None
                        return u, { Status = status; Result = None; ErrorType = err }
                    }
                let prop =
                    Prop.forAll (Arb.fromGen (Gen.nonEmptyListOf genPair)) (fun pairs ->
                        let units = pairs |> List.map fst |> Array.ofList
                        let items = pairs |> List.map snd |> Array.ofList
                        let chunk = { Seq = 0; Units = units; Bytes = 0 }
                        // a transport that returns exactly these items as a fake ES response
                        let json =
                            let item it =
                                let errPart = match it.ErrorType with Some e -> sprintf ""","error":{"type":"%s"}""" e | None -> ""
                                sprintf """{"create":{"_id":"x","status":%d%s}}""" it.Status errPart
                            sprintf """{"items":[%s]}""" (items |> Array.map item |> String.concat ",")
                        let transport =
                            { Post = fun _ -> async { return Ok (RawBulkResponse json) } }
                        // single attempt so 429s become "retries exhausted" faults deterministically
                        let policy = { RetryPolicy.standard with MaxAttempts = 1 }
                        let o = Run.sendChunkWithRetry transport Plan.CreateIfAbsent policy chunk |> Async.RunSynchronously
                        let n201 = items |> Array.filter (fun i -> i.Status = 201) |> Array.length
                        let n409 = items |> Array.filter (fun i -> i.Status = 409) |> Array.length
                        // every doc lands somewhere; created/already match; 429+400 are faults
                        o.Created = n201
                        && o.AlreadyPresent = n409
                        && o.Created + o.AlreadyPresent + o.Overwritten + List.length o.Faults = units.Length)
                Check.QuickThrowOnFailure prop
            }

            test "idempotent re-run: an all-409 response is clean (zero faults, all AlreadyPresent)" {
                let units = [| for i in 1..10 -> { Id = sprintf "id%d" i; Lines = "x"; Bytes = 1 } |]
                let chunk = { Seq = 0; Units = units; Bytes = 10 }
                let json =
                    sprintf """{"items":[%s]}"""
                        (units |> Array.map (fun _ -> """{"create":{"_id":"x","status":409}}""") |> String.concat ",")
                let transport = { Post = fun _ -> async { return Ok (RawBulkResponse json) } }
                let o = Run.sendChunkWithRetry transport Plan.CreateIfAbsent RetryPolicy.standard chunk |> Async.RunSynchronously
                Expect.equal o.AlreadyPresent 10 "all docs already present"
                Expect.isEmpty o.Faults "409 on create is resumable success, not a fault"
            }
        ]