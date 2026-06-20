# CLAUDE.md — pipeline troubleshooting discipline (always loaded; keep lean)

## How we work
- Run **THE DESCENT**. Stop at the first gate that convicts. Do not load a lower
  tier of context until the gate above it is green. (Full protocol: skill `pipeline-descent`.)
- A valid request that returns **zero hits** when data should exist → run **THE SHRINK**
  (ddmin over the query predicates) BEFORE anything else. Test the analyzer / `term`-vs-`match`
  mismatch FIRST, then case sensitivity, then `minimum_should_match` flip, then nested scope.
- Infer context **just in time** from the codebase. We do NOT write a big-bang spec/SDD up front.

## Non-negotiables
- **Probes are READ-ONLY** in every environment (prod and non-prod). Never index/update/delete in ES,
  never DML in Oracle, never reset/commit Kafka offsets. Fixes go through plan → approval → reviewed script.
- Tooling is **F#** (`.fsx`). parse-don't-validate at every boundary; DUs over classes; `Result` over
  exceptions; types as proofs; typed telemetry as data. Flag any C# idiom that leaks into F# with ⚠️.
- The **C# Web API is read-only intelligence**. Re-parse its OpenAPI + query builder into `LineageEdge`
  values; never adopt its class/exception patterns.
- **Lineage is a LOOKUP** from the ETL fsproj (the project that manages the full Oracle→ES load), never a guess.
- **Oracle is ground truth.** Never "fix" ES to mask a source-of-record defect — escalate to the data owner.
- A verdict is **incomplete without a regression property test** (FsCheck/Expecto).

## Session hygiene
- One ticket per session/branch. Start fresh so old ticket context can't poison the next.
- Keep per-ticket facts in `tickets/<JIRA-ID>/NOTES.md`, not in your head.
- Heavy reading (scanning the fsproj) goes to the `lineage-resolver` subagent; only the resolved
  lineage comes back to the main thread.

## Pointers
- Protocol + shrink ladder: `.claude/skills/pipeline-descent/SKILL.md`
- Domain rules: `.claude/rules/`
- F# kit: `fsx/`  ·  Seed catalogs: `docs/ai/`

## Reliability layer
- Implements the six agent-reliability patterns; tradeoffs in `.claude/rules/agent-reliability.md`.
- Before committing a `RootCause`, run **rung 7 (reflection)**: critique vs evidence + an independent
  re-probe, and require the regression property to FAIL on the bug. No self-grading as the only critic.
- Score the descent itself against `evals/` — reward correct cause + correct culprit + early stop + zero writes.

## Knowledge capture (OKF)
- Residue is captured as an **OKF v0.1 bundle** in `knowledge/` (markdown concepts + frontmatter, cross-linked).
  Rules: `.claude/rules/knowledge-capture-okf.md`. It complements (links to, never duplicates) your ODCS/ODPS catalog.
