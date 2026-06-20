# Rule: Elasticsearch + Kafka troubleshooting guardrails

## Elasticsearch — zero-hit diagnosis order (by base rate)
1. **Analyzer / term-vs-match** — `term` on a `text` field matches analyzed tokens, never the raw phrase;
   `match` on a `keyword` matches verbatim. Debug with `_analyze` (compare index vs query tokens).
   Use `match` on `text`, `term` on `text.keyword`.
2. **Case** — `term` is case-sensitive. Use `case_insensitive:true` (>=7.10, keyword) or a lowercase normalizer.
3. **`minimum_should_match` flip** — a `should` set defaults to "at least 1 required" only with no `must`/`filter`.
   Adding a `must` silently makes `should` optional. Set it explicitly; tag clauses with `_name`.
4. **Nested scope** — query `nested` fields via a `nested`+`path` wrapper; `object` arrays flatten and lose correlation.
5. **Mapping** — `_field_caps?fields=f` for type/searchable; then `_mappings`.
6. **Range/alias** — `_validate/query?rewrite=true` to see the real Lucene; check the alias write-index.

Diagnostic triad: `_analyze` · `_validate/query?rewrite=true` · `_explain/<known-good-id>`.
Watch `indices.query.bool.max_clause_count` (4096 on 8.x) — shrink logical predicates, not expanded clauses.

## Kafka / CDC — realtime guardrails
- Topic should be keyed by `${primaryKeys}` so all changes to a row land on one partition in commit order.
- Read one message deterministically: `--partition P --offset O --max-messages 1`.
- Lag: `consumer-groups --describe` → CURRENT-OFFSET, LOG-END-OFFSET, LAG per partition.
- OGG envelope fields: `op_type` (I/U/D/T), `op_ts` (source trail, replay-stable), `pos`, `primary_keys`, `${csn}`.
- Out-of-order CDC overwriting newer data = use **external versioning on CSN/SCN** (`version_type=external`),
  not last-write-wins. In-cluster concurrency: `if_seq_no` + `if_primary_term`.
- NEVER reset or commit offsets as a "probe". Read-only only.
