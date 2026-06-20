# Rung 2 — Reproduce & validate; if zero hits, SHRINK

**Goal:** reproduce the symptom, decide consumer-side vs pipeline, and for empty results, isolate the culprit field.

1. Replay the consumer's exact request against the scoped env (`fsx/Descent.Probes.fsx` → `replay`).
2. Parse it against OpenAPI (parse, don't validate).
   - Malformed → **`InvalidRequest`** (stop; consumer-side).
   - Valid, returns the WRONG value → descend to rung 3.
   - Valid, returns **zero hits** when data should exist → **THE SHRINK** (below).

## THE SHRINK (query bisection = ddmin = FsCheck shrinking)
1. Confirm the full predicate set returns zero, and a baseline (ID-only or `match_all`) finds the doc.
2. Run `ddmin` over the predicate set (`fsx/Descent.Shrink.fsx`) → the 1-minimal subset that still returns zero.
3. Classify WHY the culprit empties it — test in this order:
   analyzer/`term`-vs-`match` → case → `minimum_should_match` flip → nested scope → mapping → range/alias.
   Use `_analyze`, `_validate/query?rewrite=true`, `_explain/<known-good-id>` (the id comes from lineage, rung 3).
   Detail: `../reference/es-zero-hit-ladder.md`.

**Gate:** culprit + cause classified → that's the verdict (often a `ContractDrift`/query-builder fix). Emit residue.
If the data truly isn't in ES at all → descend (rung 3+) to find where it was lost.
