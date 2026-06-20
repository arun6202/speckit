# Rung 4 — System of record (Oracle = ground truth)

**Goal:** decide whether the bug is a data problem or a pipeline problem.

- Query Oracle (read-only) for the keyed record along the lineage edge (`fsx/Descent.Probes.fsx` → `sor`).

**Gate:**
- Oracle value WRONG → **`SorDataIssue`** (stop; escalate to the data owner with SQL evidence — do NOT patch ES).
- Oracle value RIGHT but API wrong → the drift is below the API and above Oracle. Descend to rung 5,
  and drop Oracle from context (ground truth established).
