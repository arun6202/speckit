// Entry point / orchestrator (SKELETON). Wires probes + engine for one ticket.
// Usage: dotnet fsi run-descent.fsx --ticket JIRA-1234 --env uat
#load "Descent.Domain.fsx"
#load "Descent.Probes.fsx"
#load "Descent.Shrink.fsx"
#load "Descent.Realtime.fsx"
#load "Descent.Engine.fsx"
open Descent.Domain
open Descent.Engine

// TODO:
//  1. parse args (--ticket, --env); load connections.json for the env (read-only creds).
//  2. triage the ticket -> Scope (endpoint, key, request, expected/actual).
//  3. implement each rung's gate as an async returning Clear | Convict cause:
//     - Reproduce: replay; if zero hits -> Shrink.ddmin + Shrink.classify -> Convict.
//     - Lineage:   spawn/equivalent lineage-resolver -> LineageEdge + known-good EsId.
//     - Sor:       Probes.oracleRead -> compare.
//     - Reconcile: re-run transform for one record -> diff target.
//     - Realtime:  Realtime.rtTrace -> Realtime.toCause.
//  4. append every step to tickets/<JIRA-ID>/NOTES.md (the evidence file).
//  5. on Convict: print Verdict and the regression property to add (FsCheck/Expecto).

let demoGate (rung: Rung) : Async<GateOutcome> =
    async { return Clear } // TODO replace with real gates

descend demoGate
|> Async.RunSynchronously
|> printfn "%A"
