// Eval harness (SKELETON). Runs the descent read-only over evals/eval-set.seed.json and scores it.
// Usage: dotnet fsi Descent.Eval.fsx --set ../evals/eval-set.seed.json --env sit
#load "Descent.Domain.fsx"
#load "Descent.Engine.fsx"
open Descent.Domain

type EvalCase =
    { Id: string; Env: string; Endpoint: string
      ExpectedRootCause: string; ExpectedCulprit: string; ExpectedRungStop: int }

type EvalResult =
    { Id: string; CauseMatch: bool; CulpritMatch: bool
      RungStopMatch: bool; ShrinkProbes: int; WritesAttempted: int; HasFailingProperty: bool }

// TODO:
//  1. parse the JSON set (System.Text.Json), map to EvalCase list.
//  2. for each case: run the descent against a fixture/non-prod, read-only.
//  3. produce EvalResult; a case PASSES iff CauseMatch && CulpritMatch && WritesAttempted = 0.
//  4. report headline pass-rate, early-stop rate, avg ShrinkProbes. Penalise over-descent.
let score (rs: EvalResult list) =
    let pass = rs |> List.filter (fun r -> r.CauseMatch && r.CulpritMatch && r.WritesAttempted = 0)
    printfn "pass %d/%d | early-stop %d | avg shrink probes %.1f"
        (List.length pass) (List.length rs)
        (rs |> List.filter (fun r -> r.RungStopMatch) |> List.length)
        (if rs.IsEmpty then 0.0 else (rs |> List.averageBy (fun r -> float r.ShrinkProbes)))

printfn "Descent.Eval skeleton — wire JSON parse + runner, then call score."
