# Rule: the descent protocol (how to triage every ticket)

Six rungs. Each is a yes/no **gate**. Clear it → descend. Fail it → convict and stop.
A green gate is the only permission to load the next layer's context.

1. **Triage & scope** — env, endpoint, module, record key, request, expected vs actual. Prune to one lineage subgraph.
2. **Reproduce & validate** — replay the exact request. Malformed → `InvalidRequest`. Valid but zero hits → **THE SHRINK**. Wrong value → descend.
3. **Lineage** — look up API field → ES field (C# query builder ⚠️) → Oracle column (ETL fsproj). Wrong binding → `ContractDrift`.
4. **System of record** — read Oracle for the key. Wrong → `SorDataIssue` (escalate). Right → descend, drop Oracle from context.
5. **Batch reconcile** — re-run the transform for one record, diff vs target. Mismatch → `TransformDefect`. Match → realtime.
6. **Realtime trace** — Oracle → Kafka(key) → temp ES → target merge. → `RealtimeStale` | `RealtimeDrop` | `MergeReorder`.

Most tickets convict at rung 1–3 and never touch Oracle, ETL, or Kafka. Stop early.
