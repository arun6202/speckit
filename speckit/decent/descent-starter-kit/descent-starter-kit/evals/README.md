# evals — score the descent itself

A small, hard set the troubleshooting agent is measured against. Two purposes:
1. Catch regressions in the protocol/tooling when you change them.
2. Prove the descent **generalises** (converges to the true culprit, locates the right hop, stops early) —
   not just that it memorised these cases.

## Files
- `eval-set.seed.json` — 10–20 hard tickets (2 filled from the worked examples; add yours).
- `score-descent.md` — what "good" means and how to score a run.

## Run (concept)
For each case: run the descent read-only against a fixture/non-prod, capture the produced `RootCause`,
the culprit field/hop, the number of predicate-probes the shrink used, and the rung it stopped at.
Compare to `expected_*`. Scaffold: `../fsx/Descent.Eval.fsx`.

> Watch eval overfit: if you tune the protocol until this set is 100%, expand the set before trusting it.
