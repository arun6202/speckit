namespace Descent
#load "Descent.Domain.fsx"
#load "Descent.Probes.fsx"
open Descent.Domain
open Descent.Probes

/// Realtime trace: walk Oracle -> Kafka -> temp ES -> target merge; find where the change stopped.
module Realtime =

    type RtContext =
        { Oracle: obj            // OracleRO (opaque)
          Es: obj                // EsRO
          Kafka: obj             // KafkaRO
          Topic: string
          Group: string
          TempIndex: EsIndex
          TargetIndex: EsIndex }

    /// Returns the first hop where the change is missing/late, else ArrivedAt TargetMerge.
    /// SKELETON: wire each step to the read-only probes; compare op_ts/pos/csn along the trail.
    let rtTrace (_ctx: RtContext) (_key: BusinessKey) : Async<HopResult> =
        async {
            // 1. Oracle changed & committed?            -> else StoppedAt OracleRow
            // 2. Kafka message at key (partition+offset)? compare op_type/op_ts/pos/csn
            //                                            -> else StoppedAt KafkaMsg
            // 3. consumer lag acceptable?               -> else StoppedAt Consumer (RealtimeStale)
            // 4. temp ES doc landed (op_ts matches)?    -> else StoppedAt TempEs
            // 5. target merge applied, in order
            //    (external version / _seq_no)?          -> else StoppedAt TargetMerge (MergeReorder)
            return ArrivedAt TargetMerge // TODO
        }

    /// Map a HopResult to a RootCause (lag value comes from kafkaGroupLag).
    let toCause (topic: string) (lagMs: int) (key: BusinessKey) = function
        | ArrivedAt TargetMerge          -> None
        | StoppedAt (Consumer, _)        -> Some (RealtimeStale (topic, lagMs))
        | StoppedAt (TargetMerge, r) when r.Contains "order" -> Some (MergeReorder key)
        | StoppedAt (stage, _)           -> Some (RealtimeDrop (stage, key))
        | ArrivedAt _                    -> None
