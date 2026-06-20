namespace Descent
/// The world parsed into closed sets. No classes, no nulls, no exceptions as control flow.
module Domain =

    // --- single-case DUs kill primitive obsession ---
    type Env = Prod | NonProd of slot: string
    type BusinessKey = BusinessKey of string
    type EsId = EsId of string
    type EsIndex = EsIndex of string

    // --- a query predicate: each one a "delta" the shrink can drop ---
    type MatchKind = Term | Match | Phrase | RangeK | Nested of path: string
    type Predicate =
        { Field: string; Value: string; Kind: MatchKind; Name: string } // Name -> _name -> matched_queries

    // --- the shrink oracle: three-valued so a flaky probe is never read as a real result ---
    type Probe3 = Found | NotFound | Unresolved

    // --- realtime hops ---
    type Stage = OracleRow | GoldenGate | KafkaMsg | Consumer | TempEs | TargetMerge
    type HopResult =
        | ArrivedAt of Stage
        | StoppedAt of Stage * reason: string

    // --- one closed set of causes. classify : evidence -> exactly one ---
    type RootCause =
        | InvalidRequest   of field: string * rule: string
        | AnalyzerMismatch of field: string * indexTokens: string list * queryTokens: string list
        | CaseMismatch     of field: string * sent: string * stored: string
        | ShouldFlip       of clause: string
        | NestedScope      of path: string
        | MappingIssue     of field: string * detail: string
        | ContractDrift    of apiField: string * esField: string
        | SorDataIssue     of table: string * key: BusinessKey
        | TransformDefect  of field: string
        | RealtimeStale    of topic: string * lagMs: int
        | RealtimeDrop     of stage: Stage * key: BusinessKey
        | MergeReorder     of key: BusinessKey

    type ProbeError = ProbeError of string

    // --- evidence & verdict: a verdict is incomplete without a regression test ---
    type Evidence = { Step: string; Detail: string }
    type Verdict =
        { Cause: RootCause
          Evidence: Evidence list
          /// the fix is not done until this exists (FsCheck/Expecto property name)
          Regression: string }
