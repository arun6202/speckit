# Defect taxonomy (SEED — maps symptom -> likely layer)

| Symptom | Likely layer | First move |
|---|---|---|
| Valid request, zero hits, data should exist | query/contract | THE SHRINK (ddmin) then classify |
| API response wrong, direct ES query correct | C# response mapper | trace mapper; add API test |
| Direct ES doc wrong, Oracle correct | ETL transform / stale batch / CDC merge | lineage + reconcile + rtTrace |
| Oracle also "wrong" | source-of-record / reporter expectation | escalate with SQL evidence |
| Oracle updated recently, ES old | CDC lag/failure | rtTrace (rung 6) |
| Temp ES correct, target wrong | merge/upsert/idempotency/order | check _id, version, conflict, write alias |
| Non-prod fails, prod works (or vice versa) | env/config/data drift | env diff (known-envs.md) |
| Only one tenant/user fails | security/tenant filter | compare claims & filtered alias |
| Intermittent | race / refresh / consumer lag / out-of-order CDC | timestamps, versions, offsets, repeatable replay |

Append a row whenever a ticket reveals a pattern not listed.
