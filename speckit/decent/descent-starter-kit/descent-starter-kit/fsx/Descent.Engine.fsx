namespace Descent
#load "Descent.Domain.fsx"
open Descent.Domain

/// Pure planner + the lazy descent. The planner decides the next rung; the runner (injected) executes it.
/// Stops the instant a gate convicts. This file is pure; effects are passed in.
module Engine =

    type Rung = Triage | Reproduce | Lineage | Sor | Reconcile | Realtime
    type GateOutcome = Clear | Convict of RootCause

    /// Given the rungs cleared so far, what's next? None = convicted/done.
    let next (cleared: Rung list) : Rung option =
        match List.tryLast cleared with
        | None            -> Some Triage
        | Some Triage     -> Some Reproduce
        | Some Reproduce  -> Some Lineage
        | Some Lineage    -> Some Sor
        | Some Sor        -> Some Reconcile
        | Some Reconcile  -> Some Realtime
        | Some Realtime   -> None

    /// Fold the descent: run each rung's gate (effectful, injected) until convict or bottom.
    let descend (runGate: Rung -> Async<GateOutcome>) : Async<Result<Rung list, RootCause>> =
        let rec go cleared =
            async {
                match next cleared with
                | None      -> return Ok cleared            // reached the bottom with no conviction
                | Some rung ->
                    match! runGate rung with
                    | Clear        -> return! go (cleared @ [rung])
                    | Convict c    -> return Error c        // found it — stop, prune the rest
            }
        go []
