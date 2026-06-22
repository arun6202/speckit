namespace Etl.EsSink

// =============================================================================
//  Elasticsearch bulk sink â€” SCN-gated, idempotent, transaction-grouped.
//
//  Pipeline (effect surface = exactly one call: BulkTransport.Post):
//
//      TxnGroup â”€â”€Plan.planGroupâ”€â”€â–¶ PlannedTxn      (pure, total, Result)
//               â”€â”€Wire.encodeâ”€â”€â”€â”€â–¶ NdjsonBody       (pure)
//               â”€â”€Transport.Postâ”€â–¶ RawBulkResponse  (effect, Async<Result>)
//               â”€â”€Run.parseâ”€â”€â”€â”€â”€â”€â–¶ BulkItemResult[] (pure, Result)
//               â”€â”€Run.interpretâ”€â”€â–¶ Lineage<Ack>     (pure, Writer)
//
//  Discipline (non-negotiable):
//    â€¢ parse-don't-validate  â€” every boundary parses to a proof type
//    â€¢ types-as-proofs       â€” DocId/Scn/IndexName are private single-case DUs
//    â€¢ DUs over classes       â€” BulkOp is a CLOSED algebra; no inheritance
//    â€¢ Result over exceptions â€” exceptions converted ONLY at interop edges (âš )
//    â€¢ Writer monad           â€” lineage threaded through the ack path
//    â€¢ property tests         â€” FsCheck/Expecto at the bottom
//
//  Three load-bearing decisions, called out where they live:
//    1. 409 version_conflict â‰¡ Superseded â‰¡ idempotent SUCCESS (not a fault).
//    2. compact = Oracle last-writer-wins within the txn boundary.
//    3. ES bulk is NOT atomic; Oracle atomicity is enforced at CHECKPOINT
//       time via AckSummary.settled, never assumed at the ES layer.
//
//  NuGet: FsToolkit.ErrorHandling, FsCheck, Expecto (tests only).
//  Target: net10.0, ES 9.x. System.Text.Json is in-box.
// =============================================================================

module Domain =

    open System

    /// Failures that can arise while turning a source row into a proof.
    type PlanError =
        | EmptyDocId
        | NegativeScn        of int64
        | InvalidIndex       of reason: string
        | RenderFailed       of field: string * reason: string
        | KeyDerivationFailed of reason: string

    /// Deterministic document identity â€” derived from the source key, never
    /// ES-assigned. This is what makes the upsert idempotent.
    type DocId = private DocId of string
    module DocId =
        let create (s: string) : Result<DocId, PlanError> =
            if String.IsNullOrWhiteSpace s then Error EmptyDocId
            else Ok (DocId (s.Trim()))
        let value (DocId s) = s

    /// GoldenGate System Change Number. Monotonic per source; carried as the ES
    /// external version so out-of-order / replayed writes converge to max-SCN.
    type Scn = private Scn of int64
    module Scn =
        let create (n: int64) : Result<Scn, PlanError> =
            if n < 0L then Error (NegativeScn n) else Ok (Scn n)
        let value (Scn n) = n

    /// A refined ES index name (subset of the real rules; enough to be safe).
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

    /// Closed algebra of bulk operations. No ES-assigned ids, no partial scripted
    /// updates: every op is SCN-gated and idempotent by construction. The phantom
    /// 'doc ties a plan to ONE document family â€” a planner for index A cannot emit
    /// ops carrying B's shape.
    type BulkOp<'doc> =
        | Upsert of DocId * Scn * 'doc    // -> index, version_type=external
        | Retire of DocId * Scn           // -> delete, version_type=external

    /// Identity + version of an op, regardless of variant.
    let key : BulkOp<'doc> -> DocId * Scn = function
        | Upsert (id, scn, _) -> id, scn
        | Retire (id, scn)    -> id, scn

    /// CDC row image. Delete carries no after-image, only the key.
    type RowImage<'src> =
        | Present of 'src
        | Absent

    type ChangeEvent<'key, 'src> =
        { Scn   : Scn
          Key   : 'key
          Image : RowImage<'src> }

    type TxnId = TxnId of string

    /// One Oracle transaction's worth of change events. Planned + acked as a unit.
    type TxnGroup<'key, 'src> =
        { Xid    : TxnId
          Events : ChangeEvent<'key, 'src> list }

    /// The shared, DECLARATIVE mapping consumed by BOTH batch and realtime paths.
    /// Pure. KeyId must derive identity from the key alone (deletes have no row).
    type Projection<'key, 'src, 'doc> =
        { KeyId  : 'key -> Result<DocId, PlanError>
          DocId  : 'src -> Result<DocId, PlanError>
          Render : 'src -> Result<'doc,  PlanError> }

    let private planEvent (p: Projection<'key, 'src, 'doc>) (ev: ChangeEvent<'key, 'src>) =
        match ev.Image with
        | Present src ->
            result {
                let! id  = p.DocId src
                let! doc = p.Render src
                return Upsert (id, ev.Scn, doc)
            }
        | Absent ->
            result {
                let! id = p.KeyId ev.Key
                return Retire (id, ev.Scn)
            }

    /// Keyed-state compaction = Oracle last-writer-wins INSIDE the txn boundary.
    /// Collapse same-id ops to the max-SCN survivor, then order by SCN so the wire
    /// output is reproducible. This is deterministic and total.
    let compact (ops: BulkOp<'doc> list) : BulkOp<'doc> list =
        ops
        |> List.groupBy (key >> fst)
        |> List.map (fun (_, grp) -> grp |> List.maxBy (key >> snd >> Scn.value))
        |> List.sortBy (key >> snd >> Scn.value)

    type PlannedTxn<'doc> =
        { Xid : TxnId
          Ops : BulkOp<'doc> list }

    /// Pure, total planner. A SINGLE malformed row fails the WHOLE group â€” no
    /// partial transaction ever reaches ES, preserving Oracle atomicity at the
    /// plan boundary (the second guard is at checkpoint time; see AckSummary).
    let planGroup (p: Projection<'key, 'src, 'doc>) (g: TxnGroup<'key, 'src>)
        : Result<PlannedTxn<'doc>, PlanError> =
        g.Events
        |> List.traverseResultM (planEvent p)
        |> Result.map (fun ops -> { Xid = g.Xid; Ops = compact ops })


module Wire =

    open System.Text
    open System.Text.Json
    open Domain
    open Plan

    type NdjsonBody = NdjsonBody of string

    /// Doc serializer injected by the caller (FsCodec / System.Text.Json).
    /// 'doc -> compact single-line JSON.
    type DocEncoder<'doc> = 'doc -> string

    // Action lines are tiny + fixed-shape. Built via STJ so _id / index values are
    // correctly JSON-escaped (a deterministic composite DocId may contain quotes).
    let private indexAction (idx: string) (id: string) (scn: int64) =
        JsonSerializer.Serialize
            {| index = {| _index = idx; _id = id; version = scn; version_type = "external" |} |}
    let private deleteAction (idx: string) (id: string) (scn: int64) =
        JsonSerializer.Serialize
            {| delete = {| _index = idx; _id = id; version = scn; version_type = "external" |} |}

    /// Pure: ordered ops -> NDJSON. Order IS the wire contract: ES returns items
    /// in request order, which the ack interpreter relies on for pairing.
    ///
    /// âš  Windows gotcha: the _bulk API requires '\n' delimiters and a trailing
    ///   newline. StringBuilder.AppendLine emits Environment.NewLine ("\r\n" on
    ///   Windows) which ES rejects â€” so we append '\n' explicitly.
    /// âš  The StringBuilder is a LOCAL mutable confined to this pure function; it
    ///   never escapes. This is the perf-correct choice, not C#-style mutation
    ///   leaking into the domain.
    let encode (index: IndexName) (enc: DocEncoder<'doc>) (ops: BulkOp<'doc> list) : NdjsonBody =
        let idx = IndexName.value index
        let sb = StringBuilder ()
        let line (s: string) = sb.Append(s).Append('\n') |> ignore
        for op in ops do
            match op with
            | Upsert (id, scn, doc) ->
                line (indexAction idx (DocId.value id) (Scn.value scn))
                line (enc doc)
            | Retire (id, scn) ->
                line (deleteAction idx (DocId.value id) (Scn.value scn))
        NdjsonBody (sb.ToString ())


module Lineage =

    open Domain
    open Plan

    /// A single immutable record of what happened to one op. Telemetry-AS-lineage:
    /// these entries ARE the audit trail, not a side log.
    type LineageEntry =
        { Xid     : TxnId
          Id      : DocId
          Scn     : Scn
          Outcome : string
          Status  : int }

    /// Writer specialized to the free monoid of lineage entries.
    ///
    /// âš  PERF: bind uses list append (w1 @ w2), which is O(nÂ²) over a large bulk
    ///   batch. For hot paths swap the carrier for a difference list:
    ///       type Lineage<'a> = Lineage of 'a * (LineageEntry list -> LineageEntry list)
    ///   making bind O(1) and run a single O(n) apply. Kept as a plain list here
    ///   for legibility; the interface below does not change.
    type Lineage<'a> = Lineage of 'a * LineageEntry list

    let run  (Lineage (a, w)) = a, w
    let value (Lineage (a, _)) = a
    let ret  a = Lineage (a, [])
    let tell entries = Lineage ((), entries)
    let map f (Lineage (a, w)) = Lineage (f a, w)
    let bind f (Lineage (a, w1)) =
        let (Lineage (b, w2)) = f a
        Lineage (b, w1 @ w2)

    type LineageBuilder () =
        member _.Return x          = ret x
        member _.ReturnFrom (m: Lineage<_>) = m
        member _.Bind (m, f)       = bind f m
        member _.Zero ()           = ret ()
        member _.Combine (m1, m2)  = bind (fun () -> m2) m1
        member _.Delay f           = f ()

    let lineage = LineageBuilder ()


module Run =

    open System.Text.Json
    open Domain
    open Plan
    open Wire
    open Lineage

    type TransportError =
        | Network         of string
        | ProtocolMismatch of expected: int * actual: int
        | MalformedResponse of string

    type RawBulkResponse = RawBulkResponse of json: string

    /// The ONLY effect the sink depends on. Adapter wraps the ES low-level
    /// transport or a bare HttpClient POST to /_bulk. A minimal port = an
    /// auditable effect boundary and a trivially fakeable runner.
    type BulkTransport =
        { Post : NdjsonBody -> Async<Result<RawBulkResponse, TransportError>> }

    type ActionKind = IndexAck | DeleteAck

    type BulkItemResult =
        { Action    : ActionKind
          Id        : string
          Status    : int
          Result    : string option   // "created" | "updated" | "deleted" | "not_found" | ...
          ErrorType : string option } // e.g. "version_conflict_engine_exception"

    type BulkFault = { Id: string; Status: int; Reason: string }

    /// Terminal classification of one op against its echoed item.
    type ItemOutcome =
        | Applied    of DocId * Scn   // created / updated / deleted â€” version advanced
        | Superseded of DocId * Scn   // 409: a >= SCN already landed â†’ end-state holds
        | Vanished   of DocId         // delete on an absent doc â€” already gone
        | Faulted    of DocId * BulkFault

    type AckSummary =
        { Applied: int; Superseded: int; Vanished: int; Faults: BulkFault list }
    module AckSummary =
        let empty = { Applied = 0; Superseded = 0; Vanished = 0; Faults = [] }
        /// SETTLED = safe to advance the consumer checkpoint past this txn.
        /// ES bulk is not atomic, so Oracle atomicity is enforced HERE: the txn is
        /// only checkpointable once every op reached a terminal-GOOD state. Any
        /// fault â‡’ replay the whole group (idempotency makes replay safe).
        let settled s = List.isEmpty s.Faults

    // --- pure: ES response JSON -> ordered item results. Never throws inward. ---
    let parseResponse (RawBulkResponse json) : Result<BulkItemResult list, TransportError> =
        try
            use doc = JsonDocument.Parse json
            let items = doc.RootElement.GetProperty "items"
            let getStr (el: JsonElement) name =
                match el.TryGetProperty name with
                | true, v when v.ValueKind = JsonValueKind.String -> Some (v.GetString())
                | _ -> None
            let results =
                [ for itemEl in items.EnumerateArray() do
                    let prop = itemEl.EnumerateObject() |> Seq.head   // single verb property
                    let body = prop.Value
                    let status =
                        match body.TryGetProperty "status" with
                        | true, v -> v.GetInt32()
                        | _       -> -1
                    let errType =
                        match body.TryGetProperty "error" with
                        | true, e -> (getStr e "type") |> Option.orElse (Some "error")
                        | _       -> None
                    yield
                        { Action    = (if prop.Name = "delete" then DeleteAck else IndexAck)
                          Id        = getStr body "_id" |> Option.defaultValue ""
                          Status    = status
                          Result    = getStr body "result"
                          ErrorType = errType } ]
            Ok results
        with ex ->
            // âš  Sanctioned exception boundary: STJ throws on malformed input. We
            //   convert to Result here and never let it propagate inward.
            Error (MalformedResponse ex.Message)

    /// Pure: classify one planned op against its echoed item, emitting both the
    /// outcome and its lineage entry. This is where decision #1 lives.
    let private classify (xid: TxnId) (op: BulkOp<'doc>) (item: BulkItemResult)
        : ItemOutcome * LineageEntry =
        let id, scn = Plan.key op
        let outcome =
            match item.Status, item.Result, item.ErrorType with
            | 201, _, _                                    -> Applied (id, scn)
            | 200, Some ("created" | "updated" | "deleted"), _ -> Applied (id, scn)
            | 200, Some "noop", _                          -> Superseded (id, scn)
            | 404, _, _                                    -> Vanished id
            | 409, _, _                                    -> Superseded (id, scn) // external-version gate
            | s,   _, Some e                               -> Faulted (id, { Id = DocId.value id; Status = s; Reason = e })
            | s,   _, None                                 -> Faulted (id, { Id = DocId.value id; Status = s; Reason = "unclassified" })
        let label =
            match outcome with
            | Applied _    -> "applied"
            | Superseded _ -> "superseded"
            | Vanished _   -> "vanished"
            | Faulted _    -> "faulted"
        outcome, { Xid = xid; Id = id; Scn = scn; Outcome = label; Status = item.Status }

    /// Pure Writer pass: interpret the whole ack, threading lineage through the
    /// fold. Arity is PROVEN equal before we zip (parse-don't-validate); a
    /// mismatch is a protocol violation, returned as Error rather than silently
    /// truncated.
    let interpret (xid: TxnId) (ops: BulkOp<'doc> list) (items: BulkItemResult list)
        : Result<Lineage<AckSummary>, TransportError> =
        let nOps, nItems = List.length ops, List.length items
        if nOps <> nItems then Error (ProtocolMismatch (nOps, nItems))
        else
            let step (acc: AckSummary) (op, item) =
                let outcome, entry = classify xid op item
                let acc' =
                    match outcome with
                    | Applied _      -> { acc with Applied    = acc.Applied + 1 }
                    | Superseded _   -> { acc with Superseded = acc.Superseded + 1 }
                    | Vanished _     -> { acc with Vanished   = acc.Vanished + 1 }
                    | Faulted (_, f) -> { acc with Faults     = f :: acc.Faults }
                lineage {
                    do! Lineage.tell [ entry ]
                    return acc'
                }
            List.zip ops items
            |> List.fold (fun m pair -> Lineage.bind (fun acc -> step acc pair) m)
                         (Lineage.ret AckSummary.empty)
            |> Ok

    /// Effectful orchestration. The ONLY effect is transport.Post; everything
    /// before and after is pure and independently testable.
    let run (transport: BulkTransport) (index: IndexName) (enc: DocEncoder<'doc>)
            (planned: PlannedTxn<'doc>)
        : Async<Result<AckSummary * LineageEntry list, TransportError>> =
        async {
            let body = Wire.encode index enc planned.Ops
            match! transport.Post body with
            | Error e  -> return Error e
            | Ok raw ->
                return
                    parseResponse raw
                    |> Result.bind (interpret planned.Xid planned.Ops)
                    |> Result.map Lineage.run
        }


// =============================================================================
//  Property tests â€” FsCheck via Expecto. Run with `dotnet run` in a test project
//  referencing this file. Demonstrates the load-bearing invariants.
// =============================================================================
module Tests =

    open Expecto
    open FsCheck
    open FsToolkit.ErrorHandling
    open Domain
    open Plan
    open Lineage
    open Run

    // âš  Test-only generators. The failwith branches are statically unreachable
    //   (k%d is always a valid DocId; n>=0 is always a valid Scn) â€” confined to
    //   test code, never shipped.
    let private genDocId : Gen<DocId> =
        Gen.choose (1, 9999)
        |> Gen.map (fun n -> match DocId.create (sprintf "k%d" n) with Ok d -> d | Error _ -> failwith "unreachable")

    let private genScn : Gen<Scn> =
        Gen.choose (0, 1_000_000)
        |> Gen.map (fun n -> match Scn.create (int64 n) with Ok s -> s | Error _ -> failwith "unreachable")

    let private genOp : Gen<BulkOp<int>> =
        gen {
            let! id  = genDocId
            let! scn = genScn
            let! up  = Gen.elements [ true; false ]
            let! pay = Gen.choose (0, 100)
            return if up then Upsert (id, scn, pay) else Retire (id, scn)
        }

    [<Tests>]
    let suite =
        testList "EsSink" [

            test "compaction: at most one op per id, and it is the max-SCN survivor" {
                let prop =
                    Prop.forAll (Arb.fromGen (Gen.listOf genOp)) (fun ops ->
                        let c   = Plan.compact ops
                        let ids = c |> List.map (Plan.key >> fst)
                        let unique = (List.distinct ids).Length = ids.Length
                        let lww =
                            c |> List.forall (fun op ->
                                let id, scn = Plan.key op
                                let groupMax =
                                    ops
                                    |> List.filter (fun o -> fst (Plan.key o) = id)
                                    |> List.map (Plan.key >> snd >> Scn.value)
                                    |> List.max
                                Scn.value scn = groupMax)
                        unique && lww)
                Check.QuickThrowOnFailure prop
            }

            test "interpret: lineage arity = item count, and outcomes partition the total" {
                // pair each op with a plausible ES item result
                let genPair =
                    gen {
                        let! op = genOp
                        let id, _ = Plan.key op
                        let! status = Gen.elements [ 200; 201; 404; 409; 500 ]
                        let res =
                            match status with
                            | 201 -> Some "created"
                            | 200 -> Some "updated"
                            | 404 -> Some "not_found"
                            | _   -> None
                        let err =
                            match status with
                            | 409 -> Some "version_conflict_engine_exception"
                            | 500 -> Some "internal"
                            | _   -> None
                        let item =
                            { Action = IndexAck; Id = DocId.value id
                              Status = status; Result = res; ErrorType = err }
                        return op, item
                    }
                let prop =
                    Prop.forAll (Arb.fromGen (Gen.listOf genPair)) (fun pairs ->
                        let ops   = List.map fst pairs
                        let items = List.map snd pairs
                        match Run.interpret (TxnId "t") ops items with
                        | Error _ -> false
                        | Ok lin ->
                            let summary, entries = Lineage.run lin
                            let total = List.length pairs
                            List.length entries = total
                            && summary.Applied + summary.Superseded
                               + summary.Vanished + List.length summary.Faults = total)
                Check.QuickThrowOnFailure prop
            }

            test "interpret: arity mismatch is a ProtocolMismatch, not a silent truncation" {
                let ops : BulkOp<int> list = [ Retire (DocId.create "k1" |> Result.toOption |> Option.get, Scn.create 1L |> Result.toOption |> Option.get) ]
                let items : BulkItemResult list = []
                match Run.interpret (TxnId "t") ops items with
                | Error (ProtocolMismatch (1, 0)) -> ()
                | other -> failtestf "expected ProtocolMismatch(1,0), got %A" other
            }
        ]