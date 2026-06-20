# Rung 5 — Batch reconcile (re-run the transform)

**Goal:** decide batch-vs-realtime.

- Re-run the ETL transform for this one record and diff the produced ES doc against the live target
  (`fsx/Descent.Probes.fsx` → `reconcile`).

**Gate:**
- Output != target/expected → **`TransformDefect`** (stop; deterministic, write a golden test).
- Output == expected but the live target is stale (batch simply hasn't run since the change) → the drift
  entered through realtime. Descend to rung 6.
