# Rung 6 — Realtime trace (Oracle → Kafka → temp ES → target)

**Goal:** find the hop where the change stopped.

Walk the key (`fsx/Descent.Realtime.fsx` → `rtTrace`). At each hop, read evidence:
- Oracle: did the row change & commit?
- GoldenGate/Kafka: message present at the business key? Read by `partition+offset`; compare `op_type`/`op_ts`/`pos`/`csn`.
- Consumer: `consumer-groups --describe` → lag.
- Temp ES: did the doc land?
- Target merge: did the upsert apply, in order? Check external version / `_seq_no`.

Detail + the arrival "bonus tip": `../reference/ogg-kafka-envelope.md`.

**Gate (convict):** **`RealtimeStale`** (lag) · **`RealtimeDrop`** (missing at a hop) · **`MergeReorder`**
(older event overwrote newer — fix with external versioning on CSN/SCN, not last-write-wins).
