# Oracle End-to-End Field Guide

**State-of-the-art as of June 2026 · data-engineering lens · the deep companion to the tabbed HTML guide**

This reference expands every section of the HTML guide. It's written for an architect/data engineer treating Oracle as both the system of record and the upstream source for analytics, search, and AI — with a deliberate bias toward the data-movement path (bulk extract + CDC → stream → land). Oracle's naming and feature set move with each quarterly Release Update, so verify version-specific facts against the primary source. See `sources.md`.

---

## Contents

1. [Overview — the whole journey](#1-overview--the-whole-journey)
2. [Architecture — how the engine works](#2-architecture--how-the-engine-works)
3. [SQL & modeling](#3-sql--modeling)
4. [Performance & operations](#4-performance--operations)
5. [Data movement — the end-to-end spine](#5-data-movement--the-end-to-end-spine)
6. [26ai & AI-native Oracle](#6-26ai--ai-native-oracle)
7. [Patterns & anti-patterns](#7-patterns--anti-patterns)
8. [Appendix — sources](#8-appendix--sources)

---

## 1. Overview — the whole journey

Oracle does two jobs: the transactional core where business truth is written, and the upstream source feeding analytics, search, and AI. The end-to-end path:

`Source (OLTP) → Bulk extract (first load) → Capture (CDC) → Stream (Kafka) → Land (Parquet/DuckDB/Elasticsearch) → Serve AI (in-DB vectors/RAG/agents)`

### What's state-of-the-art in 2026

| Area | SOTA |
|---|---|
| Naming/version | **Oracle AI Database 26ai** replaces 23ai — same 23.x code line, delivered as a Release Update. On-prem GA (Linux x86-64) Jan 2026, version `23.26.1`. |
| AI in the DB | **AI Vector Search** — native `VECTOR` type, HNSW/IVF/Hybrid indexes, in-DB ONNX embeddings, RAG in SQL. |
| Agentic access | **SQLcl MCP Server** (local) + **OCI Managed MCP** (cloud) connect AI agents to Oracle over MCP. |
| Extraction | **python-oracledb** fetches directly to Apache Arrow — zero-copy to Polars/Pandas/DuckDB and Parquet. |
| Document/relational | **JSON Relational Duality** — one source of truth, relational and JSON shapes, fully updatable. |
| CDC | Debezium reads Oracle via **LogMiner**, **XStream**, or **OpenLogReplicator** → Kafka. |
| Architecture | **CDB/PDB multitenant is mandatory** (Non-CDB removed). |
| SQL ergonomics | `BOOLEAN`, `SELECT` without `DUAL`, `IF [NOT] EXISTS`, multi-row insert, `GROUP BY` alias, `QUALIFY`. |

---

## 2. Architecture — how the engine works

To extract well — consistently, at scale, without taxing the source — you need the core model.

### Instance vs. database
- An **instance** = the in-memory **SGA** + background processes; exists only while Oracle runs.
- A **database** = the persistent files on disk.
- **RAC** = many instances mounting one database.

**SGA** holds the buffer cache (data blocks), shared pool (parsed SQL + dictionary), redo log buffer, large/Java pools, and the **vector pool** (`VECTOR_MEMORY_SIZE`) for HNSW indexes. **PGA** is private per-session memory (sorts, hash joins, cursor state) — big extracts lean on it. **Background processes**: DBWn (write dirty blocks), LGWR (flush redo), CKPT, ARCn (archive redo — the CDC source), SMON, MMON. **Files**: data files, control files, online redo logs, archived redo, temp.

### Storage hierarchy (what you read)
**Tablespace** → **Segment** (table/index/partition) → **Extent** (contiguous blocks) → **Block** (smallest I/O unit, commonly 8 KB). A partitioned table is many segments — which is exactly why **partition-wise parallel reads** scale.

### Multitenant — CDB & PDB (mandatory)
Since 21c and through 23ai/26ai, **Non-CDB is removed**. A **CDB** (container) holds the root + one or more **PDBs** (pluggable databases — self-contained, portable, clonable). Practical effects: connect strings target a **PDB service** (`host:1521/freepdb1`); CDC accounts are **common users** (`c##` prefix) at the CDB level.

### Consistency — SCN, redo, undo
Every commit advances the **System Change Number (SCN)** — a logical clock. **Read consistency** (MVCC): a query sees data as of its start SCN, reconstructing older versions from **undo** — readers never block writers, never see dirty data. Two log streams matter:
- **Redo** — ordered record of every change; drives recovery and Data Guard, and is what **LogMiner/GoldenGate/OpenLogReplicator** mine for CDC.
- **Undo** — before-images powering rollback, read consistency, and Flashback. A consistent snapshot needs enough **undo retention** to finish.

RAC (Cache Fusion), ASM (Oracle's volume manager), and Exadata (storage-offload "smart scan") build on this same model.

---

## 3. SQL & modeling

The schema decisions that matter most for a pipeline: types (downstream fidelity), indexing (finding changed rows), and **partitioning** (reading/pruning at scale).

### Data types & downstream fidelity

| Oracle type | Notes | Watch when extracting |
|---|---|---|
| `NUMBER(p,s)` | Exact, up to 38 digits | Exceeds 64-bit int/float — map to **decimal**, not double |
| `VARCHAR2` / `CLOB` | Text (byte/char semantics) | NLS charset; LOB-aware fetch for CLOB |
| `DATE` / `TIMESTAMP[ TZ]` | DATE includes time | DATE ≠ pure date; preserve time + zone |
| `BOOLEAN` | **New in 23ai** | Older ETL may not expect it |
| `JSON` | Native binary (OSON) | Maps to string/struct; consider duality views |
| `VECTOR` | AI Vector Search | Arrow-fetchable; flexible dimensions |
| `RAW` / `BLOB` | Binary | Binary-safe handling; size limits |

### Indexes & constraints
**B-tree** (default; selective lookups, ranges, your CDC watermark), **bitmap** (low-cardinality, read-mostly DW — not for high-concurrency OLTP), **function-based** (index expressions to keep predicates sargable), and **constraints** (PK/UK/FK/CHECK/NOT NULL — also the metadata CDC keys and downstream schemas depend on).

### Partitioning — the extraction superpower
Splits one logical table into many physical segments → **partition pruning** (scan only relevant partitions), **partition-wise parallel extraction** (one reader per partition), cheap bulk ops (truncate/exchange partition).

| Scheme | Splits by | Use for |
|---|---|---|
| Range / Interval | Ordered ranges (Interval auto-creates) | Time-series; incremental loads by date window |
| List | Discrete values | Region/tenant/category |
| Hash | Hash of a key | Even spread for parallelism |
| Composite | Two schemes (e.g. range-hash) | Time windows + parallel spread |
| Reference | Parent's partitioning (via FK) | Co-partition related child rows |

### PL/SQL, views & set-based reads
PL/SQL (packages, procedures, triggers) lives in the database; for movement, prefer **set-based SQL** and `BULK COLLECT`/`FORALL` over row-by-row loops. **Materialized views** precompute aggregates (query rewrite, incremental refresh). **Analytic/window functions** (`ROW_NUMBER`, `LAG`, `SUM() OVER`) handle ranking and running totals in one pass.

### 23ai/26ai SQL niceties
```sql
SELECT 5280 * 1.5;                         -- no FROM dual
CREATE TABLE IF NOT EXISTS staging (id NUMBER, active BOOLEAN);
SELECT dept_id AS d, AVG(salary) avg_sal
FROM emp GROUP BY d
QUALIFY RANK() OVER (ORDER BY avg_sal DESC) <= 3;
```
Also: multi-row `INSERT`, direct `UPDATE`...join, `IF [NOT] EXISTS` for DDL, aggregation over `INTERVAL`, schema annotations.

---

## 4. Performance & operations

Pulling billions of rows is a performance problem on both sides — plans that prune/parallelize, reads that don't blow out the source's buffer cache or undo, and an HA setup that lets you offload extraction.

### Cost-based optimizer
- **Statistics** (`DBMS_STATS`) — fresh table/column/index stats; stale stats are the #1 cause of bad plans; histograms handle skew.
- **Execution plans** — `EXPLAIN PLAN` + `DBMS_XPLAN.DISPLAY_CURSOR`; look for unexpected full scans and join order.
- **Bind variables** — bind, don't concatenate literals: shares cursors, avoids hard-parse storms, prevents SQL injection.
- **Hints** — `PARALLEL`, `FULL`, `INDEX` as targeted overrides; use sparingly, document why.

### Reading at scale, kindly
- **Array / prefetch size** — the single biggest extract lever: fetch thousands of rows per round trip (`arraysize`/fetch size), not one.
- **Parallel query** — partition-wise PX scans; pair with pruning to read only what changed.
- **Compression** — Advanced Row / HCC (Exadata) shrink scanned bytes; mind CPU on writes.
- **AWR / ASH / ADDM** — find heavy SQL, waits, and time; ASH = what was active, AWR = trends, ADDM = advice.

### High availability & recovery
- **RAC** — multiple instances, one database; survives node loss; spreads load (incl. extraction sessions).
- **Data Guard** — physical/logical standbys synced via redo; **Active Data Guard** runs heavy **reads/extracts on the standby**, sparing primary.
- **RMAN** — block-level incremental backups (block change tracking); recoverability and cloning.
- **Flashback** — query/restore prior states from undo/FRA; reconcile a load against an "as-of" SCN.

**Extraction-friendly pattern:** read from an **Active Data Guard standby** at a known **SCN**, with **partition pruning + parallel** and a large **array size** — a consistent point-in-time snapshot that doesn't tax primary OLTP.

---

## 5. Data movement — the end-to-end spine

Two problems: the **initial bulk load** (read it all, fast, consistently) and **change data capture** (track every change after). Then stream and land it, preserving fidelity and staying idempotent.

### 1 · Connect
- **python-oracledb** — thin (no client) or thick; the modern Python driver; fetches **directly to Arrow**.
- **JDBC (thin)** — pure-Java for Spark/Flink/Kafka Connect; pair with UCP pooling.
- **ODP.NET** — managed/unmanaged for C# pipelines (array binds, bulk copy).
- **node-oracledb / ODBC** — Node and generic connectivity.
- **Security** — Oracle **wallets** (mTLS), Easy Connect/TNS; always a **least-privilege read-only** extract user.

### 2 · Bulk extract — the first load
- **Direct-to-Arrow** — python-oracledb `fetch_df_all()` / `fetch_df_batches()` return a DataFrame exposing the **Apache Arrow PyCapsule / ArrowArrayStream** interface → zero-copy to PyArrow, Polars, Pandas, NumPy, **DuckDB**, and Parquet. Tune with `arraysize`. (`pandas.read_sql_query` via SQLAlchemy is no longer recommended.)
- **Data Pump** (`expdp`/`impdp`) — fast parallel logical export/import between Oracle systems; seeding.
- **External tables** — read flat files (and unload via `ORACLE_DATAPUMP`) as tables; **`DBMS_CLOUD`** reads Parquet/CSV from object storage.
- **SQL\*Loader** — high-speed flat-file loads into Oracle.
- **Partition-wise + parallel** — one reader per partition + large array size; pin a **consistent SCN** across readers (`AS OF SCN`) to avoid a torn snapshot.

```python
# Oracle → Arrow → Parquet, in batches (no row-by-row overhead)
import oracledb, pyarrow as pa, pyarrow.parquet as pq
conn = oracledb.connect(user=u, password=p, dsn="host:1521/freepdb1")
writer = None
for odf in conn.fetch_df_batches("select * from orders", size=50_000):
    batch = pa.record_batch(odf)                      # Arrow, zero-copy
    writer = writer or pq.ParquetWriter("orders.parquet", batch.schema)
    writer.write_batch(batch)
writer.close()
# DuckDB can now query orders.parquet directly — no copy step
```

### 3 · Change Data Capture — the steady state
After the snapshot, mine the **redo logs** instead of re-reading the table.

| Mechanism | How | Trade-off |
|---|---|---|
| **LogMiner** | Oracle built-in package; SQL interface over redo. Debezium default (`logminer` / `logminer_unbuffered`). | No extra license; simplest. Watch SCN drift. |
| **XStream** | Native C/Java API — a licensed **GoldenGate** component. | Highest performance/control; needs GoldenGate license. |
| **OpenLogReplicator** | Open-source C++; parses redo/archive logs directly; streams JSON/Protobuf. | Low DB impact, scalable; external component (`olr` adapter). |
| **GoldenGate** | Oracle's full replication product (+ OCI GoldenGate managed); GG for Big Data → Kafka. | Enterprise-grade, heterogeneous; commercial. |

**The CDC gotcha — SCN drift:** a long-running transaction can hold the connector's position behind the range still in the redo logs, stalling capture and ballooning memory. Mitigate with adequate **redo/log retention**, a sane **offset flush interval**, and Debezium **signaling** to drop a stuck transaction. **Enable supplemental logging** on captured tables so full before/after row images are available. (Note: the Debezium Oracle connector doesn't ship the Oracle JDBC driver / XStream JAR — supply them from the Instant Client.)

### 4 · Stream & 5 · Land
CDC events flow as an ordered, keyed log — typically **Kafka** via **Debezium** (Kafka Connect) with a schema registry (Avro/JSON). Land them **idempotently**: deterministic key = source PK + change SCN/op, then upsert so replays and at-least-once delivery don't double-apply. Common sinks: **Parquet/object storage** (lake), **DuckDB** (reads Parquet/Arrow directly), **Elasticsearch** (Kafka ES sink connector, or Logstash JDBC for simple pulls). Carry **deletes/tombstones** through or downstream silently diverges.

```json
// Debezium Oracle source (Kafka Connect) — LogMiner adapter
{
  "connector.class": "io.debezium.connector.oracle.OracleConnector",
  "database.dbname": "ORCLCDB", "database.pdb.name": "ORCLPDB1",
  "database.connection.adapter": "logminer",
  "table.include.list": "SALES.ORDERS",
  "snapshot.mode": "initial",
  "schema.history.internal.kafka.topic": "schema-changes.sales"
}
```

### Type fidelity — don't lose data in transit
Map **NUMBER → decimal** (not float); preserve **DATE/TIMESTAMP time + zone**; carry **NLS charset** through (normalize to UTF-8 deliberately); handle **CLOB/BLOB** with LOB-aware fetches; decide **NULL** semantics once. Validate row counts **and** checksums per partition/window — catch silent loss, not just hard failures.

---

## 6. 26ai & AI-native Oracle

Oracle AI Database 26ai keeps the full mission-critical database and adds an AI-native surface.

### The name, decoded
**Oracle AI Database 26ai** replaces Oracle Database 23ai. It is **not a new engine** — the same **23.x** code line, delivered as a **Release Update** (apply the Oct 2025 RU; no upgrade or recertification). Version `23.26.1` = codebase 23, year 2026, quarter 1. On-prem EE (Linux x86-64) reached GA in **January 2026**. Most tools/docs still say "23ai" — same release family.

### AI Vector Search — RAG inside the database
Store embeddings next to business data in a native `VECTOR` column; run similarity search in plain SQL, combining semantic match with ordinary `WHERE` filters. Workflow: **generate** embeddings (in-DB ONNX via `DBMS_VECTOR.LOAD_ONNX_MODEL`, or external) → **store** as `VECTOR` → optionally **index** → **query**.

- **HNSW** (In-Memory Neighbor Graph) — `ORGANIZATION INMEMORY NEIGHBOR GRAPH`; fastest ANN; needs the `VECTOR_MEMORY_SIZE` SGA pool; memory-heavy for big sets.
- **IVF** (Inverted File Flat / Neighbor Partition) — `ORGANIZATION NEIGHBOR PARTITIONS`; disk + buffer cache; scales large; supports local partitioning.
- **Hybrid Vector Index** (23.6+) — Oracle Text full-text + vector semantic search in one index.

```sql
-- Approximate similarity search (uses the index)
SELECT id, VECTOR_DISTANCE(embedding, :q, COSINE) dist
FROM   documents
ORDER BY dist
FETCH APPROX FIRST 10 ROWS ONLY;   -- exact = FETCH FIRST (no index)
```
Exact search (`FETCH FIRST`) compares every vector — accurate, slow. Approximate (`FETCH APPROX FIRST`) uses the index — fast, ANN. **The query's distance metric must match the index's**, or it silently won't use it. 26ai adds **Unified Hybrid Vector Search** across multimodal data (PDFs, images, video). Supports 90+ embedding models; integrates with LangChain/LlamaIndex.

### Oracle & the Model Context Protocol
Oracle ships MCP servers so any MCP-capable assistant (Claude, Cursor, VS Code) can introspect schemas and run SQL through a trusted connection — agentic work, you approving each action.
- **SQLcl MCP Server** (July 2025) — built into Oracle SQLcl and the SQL Developer VS Code extension (auto-deploys). Tools include `list-connections`, `connect`, `run-sql`; connections in `~/.dbtools`, credentials in **SSO wallets**. Best for local dev/DBA workflows.
- **OCI Managed MCP Service** — managed MCP servers in **OCI Database Tools**; HTTPS + OCI identity for enterprise agents against 26ai and 19c in the cloud.
- **Select AI** — Autonomous Database feature: natural language → generated SQL (and RAG), guided by your metadata.

**MCP safety — the connection is the permission.** Whatever the agent can do = exactly what the **connected database user** can do. Use a **least-privilege, read-only** user against **sanitized non-prod** data, and **review every action** before approving. Never point an agent at a privileged account.

### More of the modern surface
- **JSON Relational Duality** — duality views expose relational tables as fully-updatable JSON documents (and back); document ergonomics without losing normalization/consistency.
- **Property Graph (SQL/PGQ)** — native graph queries over tables via SQL:2023 `GRAPH_TABLE` / `MATCH`.
- **In-DB ML (OML)** — train/score models where data lives; run ONNX models in-database.
- **Autonomous Database** — self-tuning, self-patching managed Oracle in OCI; same 26ai features, less ops.

---

## 7. Patterns & anti-patterns

### Extraction patterns
- **Snapshot-then-CDC** — one consistent bulk load at a known SCN, then change capture forever. Don't re-full-scan a live table on a schedule.
- **Partition-wise parallel** — one reader per partition + large array size; prune to partitions in scope.
- **SCN / watermark cursors** — track a monotonic watermark (SCN or audit timestamp) so restarts resume exactly.
- **Idempotent landing** — deterministic key = PK + change SCN/op; upsert so replays/at-least-once don't double-apply.
- **Read the standby** — offload heavy extracts to Active Data Guard; keep primary OLTP fast.
- **Validate per partition** — row counts *and* checksums; catch silent loss.

### Type-fidelity & safety checklist
| Concern | Do |
|---|---|
| NUMBER precision | Map to **decimal** (Arrow/Parquet decimal), never silently double |
| DATE vs TIMESTAMP | Preserve time + zone; don't truncate DATE |
| NLS / charset | Carry source charset; normalize to UTF-8 once |
| LOBs | LOB-aware fetch; chunk large CLOB/BLOB; consider externalizing |
| NULL semantics | Decide NULL vs empty-string vs sentinel once |
| Access | Least-privilege **read-only** user; wallet/mTLS; rotate credentials |

### Anti-patterns

**Reading & modeling**
- Row-by-row fetch (array size 1) — death by round trips.
- `SELECT *` full scans of live tables on a timer.
- Literals, not binds — hard-parse storms, injection risk.
- Ignoring partitions — scanning the whole table to find a day's changes.
- `NUMBER → double` — silent precision loss.
- No consistent SCN across parallel readers — a torn snapshot.

**CDC, landing & AI**
- No supplemental logging — CDC can't see full row images.
- Ignoring SCN drift — long transactions stall the connector.
- Non-idempotent loads — at-least-once delivery double-applies.
- Dropping deletes/tombstones — downstream silently diverges.
- God user for MCP/agents — the connection is the blast radius.
- Querying without `FETCH APPROX` — the vector index sits unused.

### Choose by the job
| Job | Reach for | Trap |
|---|---|---|
| First full load → lake | python-oracledb → Arrow → Parquet (partition-wise) | Row-by-row into pandas via SQLAlchemy |
| Oracle-to-Oracle bulk | Data Pump (parallel) | Hand-rolled CTAS over a slow link |
| Ongoing change capture | Debezium + LogMiner (or OLR / GoldenGate) | Polling `updated_at`, missing deletes |
| Heterogeneous replication | GoldenGate / OCI GoldenGate | Bespoke triggers as CDC |
| Ad-hoc analytics | DuckDB over Parquet/Arrow | Re-querying Oracle each time |
| Full-text + semantic search | Elasticsearch sink or 26ai Hybrid Vector Index | Reinventing relevance in app code |
| Agentic SQL on Oracle | SQLcl MCP Server (read-only user) | A privileged account |
| RAG over enterprise data | AI Vector Search in 26ai | Exporting everything to an external vector DB unnecessarily |

### Maturity — four pillars
- **Source discipline** — partitioned tables, fresh stats, least-priv read user, extraction offloaded to a standby at a known SCN.
- **Capture** — supplemental logging on, SCN-drift mitigations, schema-change handling, deletes/tombstones carried.
- **Fidelity** — type mapping verified, per-partition count + checksum validation, idempotent upserts.
- **AI governance** — MCP on scoped read-only users, approvals on actions, vectors/RAG kept in-DB where sovereignty matters.

---

## 8. Appendix — sources

Full link list in `sources.md`. Primary documentation and project pages, **checked June 2026**. Oracle's release naming and feature set advance with each quarterly RU — confirm version-specific facts (the 26ai/23ai naming, vector-search RU features, MCP availability) against the source for your exact version (`SELECT version_full FROM v$instance;`).
