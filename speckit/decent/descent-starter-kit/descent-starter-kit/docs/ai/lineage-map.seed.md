# Lineage map (SEED — grows one ticket at a time)

Authoritative lineage lives in the ETL fsproj; this file is the accumulated cache the descent appends to.
The `lineage-resolver` subagent fills rows; resolved tickets emit new rows here.

| Endpoint | API field | ES field | F# module.function | Oracle table.column | Rule | Freshness (batch/CDC topic) | Confidence |
|---|---|---|---|---|---|---|---|
| /accounts/{id}/balance | balance | acct_target.bal_minor | AccountProjection.balMinor | ACCT_BAL.BAL_MINOR | minor units | batch + acct.cdc | seed |
| ... | ... | ... | ... | ... | ... | ... | ... |

Also record: how the ES `_id` / business key is built (must match batch AND realtime).
