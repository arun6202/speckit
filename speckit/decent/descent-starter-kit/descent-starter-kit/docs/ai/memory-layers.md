# Layered memory (mapped) — and what to forget

| Layer | Poster term | In the descent | Lifetime |
|---|---|---|---|
| Short-term | live facts | the current ticket `Scope` (env, key, request, expected/actual) | this session only |
| Retrieved | verbatim transcripts / vector store | the codebase, ETL fsproj, sample requests — fetched **on demand** by the `lineage-resolver` subagent | per-probe |
| Episodic | summarised history | `lineage-map.seed.md`, `defect-taxonomy.md`, resolved `tickets/*/NOTES.md` | accretes across tickets |

**Retrieve on demand, don't preload.** Never pour all 50 tables / the whole OpenAPI into context up front.

**Forgetting is half of memory** (the poster skips this). Prune on every green gate:
- request validated → drop the OpenAPI contract
- lineage confirmed → drop the other tables
- SoR correct → drop Oracle
- batch clean → drop the ETL source; only the realtime path remains

**Staleness warning:** the episodic cache can be wrong after a deploy. Treat `lineage-map.seed.md` as a
hint and re-confirm the edge from the fsproj when a verdict depends on it.
