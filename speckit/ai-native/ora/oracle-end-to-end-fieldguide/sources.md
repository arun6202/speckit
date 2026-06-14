# Sources — Oracle End-to-End Field Guide

**Checked: June 2026.** Primary Oracle documentation and project pages, organized by topic. Oracle's release naming and feature set advance with each quarterly Release Update — **confirm version-specific facts** (the 26ai/23ai naming, vector-search RU features, MCP availability) against the source for your exact version: `SELECT version_full FROM v$instance;`.

---

## Oracle Database — core & 26ai/23ai

- **Oracle Database Documentation** — https://docs.oracle.com/en/database/
- **Oracle AI Database 26ai** — https://www.oracle.com/database/ai-native-database-26ai/
- **26ai announcement (blog)** — https://blogs.oracle.com/database/oracle-announces-oracle-ai-database-26ai
- **23ai GA announcement** — https://blogs.oracle.com/database/oracle-23ai-now-generally-available
- **Version numbering (Mike Dietrich)** — https://mikedietrichde.com/2025/10/14/oracle-ai-database-26ai-replaces-oracle-database-23ai/
- **ORACLE-BASE (feature articles)** — https://oracle-base.com/

## AI Vector Search & AI features

- **AI Vector Search User's Guide** — https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/
- **Release updates (vector search)** — https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/oracle-database-23ai-release-updates.html
- **HNSW vector indexes (blog)** — https://blogs.oracle.com/database/using-hnsw-vector-indexes-in-ai-vector-search
- **IVF vector indexes (blog)** — https://blogs.oracle.com/database/using-ivf-vector-indexes
- **Hybrid Vector Index (blog)** — https://blogs.oracle.com/coretec/hybrid-vector-index-the-combination-of-full-text-and-semantic-vector-search
- **JSON Relational Duality** — https://docs.oracle.com/en/database/oracle/oracle-database/23/jsnvu/
- **Select AI (Autonomous Database)** — https://docs.oracle.com/en/cloud/paas/autonomous-database/

## Oracle & MCP (agentic access)

- **Oracle MCP overview** — https://www.oracle.com/mcp/
- **Introducing the SQLcl MCP Server** — https://blogs.oracle.com/database/introducing-mcp-server-for-oracle-database
- **OCI Managed MCP Service** — https://blogs.oracle.com/database/gain-agentic-access-to-any-oracle-database-in-the-cloud-with-native-enterprise-grade-managed-mcp-servers-in-oci
- **Getting started (thatjeffsmith)** — https://www.thatjeffsmith.com/archive/2025/07/getting-started-with-our-mcp-server-for-oracle-database/
- **Oracle SQLcl** — https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/

## Drivers & bulk extraction

- **python-oracledb — Working with Data Frames (Arrow)** — https://python-oracledb.readthedocs.io/en/latest/user_guide/dataframes.html
- **python-oracledb home** — https://python-oracledb.readthedocs.io/
- **node-oracledb** — https://oracle.github.io/node-oracledb/
- **ODP.NET (ODAC)** — https://docs.oracle.com/en/database/oracle/oracle-data-access-components/
- **JDBC Developer's Guide** — https://docs.oracle.com/en/database/oracle/oracle-database/23/jjdbc/
- **Data Pump / External Tables / SQL*Loader** — https://docs.oracle.com/en/database/oracle/oracle-database/23/sutil/
- **DBMS_CLOUD** — https://docs.oracle.com/en/cloud/paas/autonomous-database/

## CDC & streaming

- **Debezium Oracle connector** — https://debezium.io/documentation/reference/stable/connectors/oracle.html
- **Debezium releases** — https://debezium.io/releases/
- **OpenLogReplicator** — https://github.com/bersler/OpenLogReplicator
- **Oracle GoldenGate** — https://docs.oracle.com/en/middleware/goldengate/
- **OCI GoldenGate** — https://www.oracle.com/integration/goldengate/
- **LogMiner (Database Utilities)** — https://docs.oracle.com/en/database/oracle/oracle-database/23/sutil/

---

*Capability descriptions in the field guide are drawn from these references. Where a claim could not be confirmed from a primary source, the guide describes it qualitatively rather than asserting a precise figure or date. Most tooling still uses the name "23ai"; "26ai" is the same 23.x release family advanced by Release Update.*
