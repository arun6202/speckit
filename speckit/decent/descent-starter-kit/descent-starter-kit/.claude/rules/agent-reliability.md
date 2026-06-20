# Rule: agent reliability patterns (mapped to the descent)

The six production-reliability patterns, as they apply to THIS troubleshooting agent.
Each has a "use it here" and a "cost/when-not" — the part a generic poster leaves out.

| Pattern | How it shows up in the descent | Cost / when NOT to lean on it |
|---|---|---|
| **1 Reflection loop** | Before accepting a verdict, critique it against the evidence and require the emitted **property test to actually fail on the bug** (rung 7). The test is the independent critic. | A model grading its *own* reasoning entrenches its blind spots. Reflection only adds value when the critic has a **different signal** (a real test, a re-query, Oracle) — not self-praise. It also costs tokens; skip it for rung-1/2 consumer-side convictions that are already mechanically proven. |
| **2 Plan & Execute** | The six-rung descent IS the plan; plan mode maps the module+lineage before probing. | A static plan locks in a wrong route. The gates ARE the replanning hook: a green gate re-decides the next probe. Don't over-plan a one-rung ticket. |
| **3 Layered memory** | short-term = ticket scope · retrieved = codebase/sample requests (on demand, via subagent) · episodic = `docs/ai/lineage-map.seed.md` + `defect-taxonomy.md` + resolved `NOTES.md`. See `docs/ai/memory-layers.md`. | Memory adds a **retrieval-failure and staleness** surface. The episodic cache can be wrong after a deploy — treat it as a hint, re-confirm from the fsproj. Pair every "add memory" with **pruning** (drop ruled-out layers); the poster omits forgetting, which is half the job. |
| **4 Tool design** | fsx micro-tools: single purpose, strict typed in/out, `Result`/DU. `ProbeError` IS the "defined fallback". | Strict schema ≠ safe. The real production risk is **side effects**: tools are read-only by construction (`ReadOnly<'conn>`) and idempotent. A clean JSON shape that mutates prod is still a defect. |
| **5 Human in the loop** | Any write/fix/reindex/backfill/offset-replay is a high-stakes step → human approval → continue. Hook denies writes; `prod-safety.md` holds the approver matrix. | HITL on *every* step destroys throughput. Gate it to **irreversible / prod-mutating / cross-tenant** actions only. Investigation stays autonomous; remediation is gated. |
| **6 Eval suite** | A curated set of hard tickets the descent is scored against (`evals/`). Every resolved ticket emits a regression property that joins CI. | 10–20 inputs is a floor, not proof. Watch for **eval overfit** (tuning the protocol to the known set). Score *generalisation*: did it converge to the true culprit / right hop with minimal predicates, and did it **stop early**? |

**Net:** the descent already embodies 2–6; reflection (1) is the addition this rule introduces (rung 7). Two things this
agent does that the poster doesn't mention — **context pruning** and a **typed failure taxonomy with a stopping rule** —
are what keep the other six from compounding into a slow, over-careful, token-hungry loop.
