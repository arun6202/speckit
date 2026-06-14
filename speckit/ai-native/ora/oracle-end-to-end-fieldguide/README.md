# Oracle End-to-End Field Guide

A consolidated, **state-of-the-art (June 2026)** reference for Oracle as both the **system of record** and the **source** of a modern data pipeline — architecture through SQL and tuning, getting data **out** at scale (bulk + change data capture), landing it in Parquet/DuckDB/Elasticsearch, and the AI-native surface of **Oracle AI Database 26ai**. Written with a data-engineering bias.

## What's in this pack

| File | What it is |
|---|---|
| **`oracle-end-to-end-field-guide.html`** | The main deliverable — a rich, **tabbed** field guide. Open in any browser; no internet or build step. |
| **`oracle-end-to-end-field-guide.md`** | The deep markdown companion — the same eight sections with heavier reference detail (SQL, code, tables). |
| **`sources.md`** | The appendix — primary Oracle docs and project links grouped by topic, "checked June 2026." |

## The eight sections

1. **Overview** — the end-to-end path (source → bulk extract → CDC → stream → land → serve AI) and what's SOTA in 2026.
2. **Architecture** — instance vs. database, SGA/PGA, the storage hierarchy, **CDB/PDB** (now mandatory), and the SCN/redo/undo consistency model.
3. **SQL & Modeling** — data types and downstream fidelity, indexes, **partitioning** (the extraction superpower), PL/SQL, and 23ai/26ai SQL niceties.
4. **Performance & Ops** — the cost-based optimizer, reading at scale (array size, parallel, pruning), and HA/DR (RAC, **Active Data Guard** for extraction offload, RMAN, Flashback).
5. **Data Movement** — the spine: connect → **bulk extract** (direct-to-Arrow, Data Pump, external tables) → **CDC** (LogMiner / XStream / OpenLogReplicator / GoldenGate) → stream (Kafka/Debezium) → land (Parquet/DuckDB/Elasticsearch), plus type fidelity.
6. **26ai & AI** — the 23ai→26ai naming, **AI Vector Search** (HNSW/IVF/Hybrid, `DBMS_VECTOR`, RAG in SQL), JSON Relational Duality, and the **SQLcl / OCI MCP servers** for agentic access.
7. **Patterns** — extraction patterns, a type-fidelity checklist, anti-patterns, a decision-by-job matrix, and maturity pillars.
8. **Sources** — primary references.

## How to use it

- Start with the **HTML** — the navigable surface (tabs; keyboard arrows work).
- Drop into the **markdown** for copyable SQL/code and tables, or to grep for a tool.
- The bias is **getting data out of Oracle faithfully and at scale**, but the architecture/SQL/tuning tabs stand on their own as a general Oracle reference.

## A note on accuracy

Oracle's release naming and feature set advance with each quarterly Release Update. Most tooling and docs still say **"23ai"**; **"26ai"** is the same 23.x release family advanced by an RU (on-prem GA Jan 2026, version `23.26.1`). Confirm anything load-bearing against the primary source (in `sources.md`) for your exact version: `SELECT version_full FROM v$instance;`.
