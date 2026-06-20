# Rule: F# discipline (the audit spine)

The diagnostic tooling is F# and obeys strict functional discipline. This is non-negotiable.

- **parse-don't-validate** — push validation to the boundary; return a parsed type that makes illegal
  states unrepresentable. Downstream code receives proof-by-type, not raw strings.
- **DUs over classes** — model the domain as discriminated unions (`RootCause`, `Predicate`, `HopResult`).
  Single-case DUs for primitives (`BusinessKey of string`) to avoid primitive obsession.
- **`Result<'T,'E>` over exceptions** — every Oracle/ES/Kafka call returns `Result`; compose with
  `Result.bind` / computation expressions. Exceptions only for true infrastructure failure.
- **types as proofs** — a constructed `MinimalFailingPredicateSet` is itself evidence the shrink converged.
  A `ReadOnly<'conn>` handle cannot express a write.
- **telemetry is data** — thread typed `Step`/`Trace` values; never bury `printf` side-effects in an effect.
- **pure core / effectful shell** — a pure `Planner` decides the next probe; an effectful `Runner` runs it.

Any C# pattern (mutable class, exception-as-control-flow, null) appearing in F# is a **⚠️ violation** — flag it.
