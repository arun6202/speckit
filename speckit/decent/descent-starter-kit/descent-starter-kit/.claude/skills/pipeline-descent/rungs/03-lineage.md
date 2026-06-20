# Rung 3 — Lineage (lookup from the ETL fsproj; reads C# ⚠️)

**Goal:** confirm the felt Oracle-contract still binds the right ES field, and get the known-good `EsId`.

- Look up: API param → ES query → ES field (from the C# query builder ⚠️), then ES field → Oracle
  `table.column` (from the ETL fsproj — the authoritative lineage source).
- Spawn the `lineage-resolver` subagent for the heavy fsproj read; it returns only typed `LineageEdge`s + the `EsId`.
- The `EsId` feeds `_explain` back in rung 2.

**Gate:** binding correct? No → **`ContractDrift`** (stop; fix the query builder / mapping). Yes → rung 4.
