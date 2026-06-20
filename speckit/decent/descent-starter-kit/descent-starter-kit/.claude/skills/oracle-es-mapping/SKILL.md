---
name: oracle-es-mapping
description: STUB / POINTER. Reference for how Oracle tables map into Elasticsearch documents (mapping rules, unit-of-work, lineage) in the ETL fsproj. Use whenever resolving how an ES field is derived from Oracle, how the ES _id/business key is constructed, or how a transform behaves. Replace this stub with your existing oracle-es-mapping skill content (progressive-disclosure reference files: mapping rules, unit-of-work, lineage).
---

# oracle-es-mapping (stub)

You already maintain this skill. Drop your real content here. The `pipeline-descent` skill calls into it
for lineage resolution. Expected reference files (fill in):

- `reference/mapping-rules.md` — field-by-field transform rules, null/temporal/case semantics.
- `reference/unit-of-work.md` — batch join shape, document identity, _id construction.
- `reference/lineage.md` — ES field → Oracle table.column, with the freshness path (batch vs CDC topic).

TODO: paste your existing skill; ensure the `_id`/business-key construction here MATCHES the realtime path.
