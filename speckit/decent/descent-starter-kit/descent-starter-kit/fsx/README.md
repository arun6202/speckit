# fsx — F# diagnostic micro-tools

Read-only probes for the descent. Each returns a `Result` or a DU. Run with `dotnet fsi`:

```bash
dotnet fsi run-descent.fsx --ticket JIRA-1234 --env uat
```

## Files (load order)
1. `Descent.Domain.fsx`   — types (DUs, single-case primitives). The whole world parsed into closed sets.
2. `Descent.Probes.fsx`   — read-only shell: Oracle / ES / Kafka I/O. The ONLY effects.
3. `Descent.Shrink.fsx`   — ddmin over predicates + classify (the zero-hit centerpiece).
4. `Descent.Realtime.fsx` — rtTrace: Oracle -> Kafka -> temp ES -> target, HopResult.
5. `Descent.Engine.fsx`   — pure Planner + the lazy descent fold.
6. `run-descent.fsx`      — entry point / orchestrator.

## Dependencies (TODO — pin yours)
These skeletons use placeholder client calls. Plug in your real clients, e.g.:
- Elasticsearch: raw HTTP via `FSharp.Data` HttpClient, or `Elastic.Clients.Elasticsearch` (⚠️ C# client — wrap at the boundary).
- Oracle: `Oracle.ManagedDataAccess.Core` (⚠️ C# client — wrap; open with SET TRANSACTION READ ONLY).
- Kafka: `Confluent.Kafka` (⚠️ C# client — wrap; consumer is read-only, never commit/reset).
Add `#r "nuget: ..."` lines at the top of `Descent.Probes.fsx` once chosen.

> Everything marked TODO is a deliberate stub — correct shape, your environment plugs in.
