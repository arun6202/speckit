# Reference — Elasticsearch zero-hit root-cause ladder

Test in this order (highest base rate first). For each, the tell and the diagnostic.

| # | Cause | Tell | Diagnostic / fix |
|---|---|---|---|
| 1 | Analyzer / term-vs-match | `term` on a `text` field (stored as analyzed tokens) or `match` on a `keyword` (stored verbatim) returns nothing | `_analyze` compare index vs query tokens; use `match` on `text`, `term` on `text.keyword` |
| 2 | Case sensitivity | `term "ACTIVE"` vs stored `"Active"` | `case_insensitive:true` (>=7.10, keyword) or lowercase normalizer |
| 3 | `minimum_should_match` flip | `should` becomes optional once a `must`/`filter` is present | set it explicitly; tag clauses with `_name` -> read `matched_queries` |
| 4 | Nested scope | querying `nested` without `nested`+`path` -> nothing; `object` array flattens -> false matches | wrap in `nested` query; use `inner_hits` |
| 5 | Mapping / field absence | wrong type, not searchable, unexpected dynamic mapping | `_field_caps?fields=f`; then `_mappings` |
| 6 | Range / TZ / alias / routing | date range off by TZ; alias points at stale/wrong write-index | `_validate/query?rewrite=true`; check alias & `index.query.default_field` |

**Diagnostic triad:** `_analyze` (tokens in vs out) · `_validate/query?rewrite=true` (the real Lucene) ·
`_explain/<known-good-id>` (why this doc didn't match).

**Caveat:** `indices.query.bool.max_clause_count` is 4096 on 8.x → `too_many_clauses`. Shrink the *logical*
predicates (one `terms` = one predicate), not the expanded clauses.
