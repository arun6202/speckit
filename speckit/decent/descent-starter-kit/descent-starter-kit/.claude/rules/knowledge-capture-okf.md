# Rule: capture knowledge as OKF (Open Knowledge Format v0.1)

The descent's residue is captured as a conformant **OKF bundle** under `knowledge/` — a directory of
markdown concepts with YAML frontmatter, cross-linked into a graph. Portable, agent- and human-readable,
version-controlled, renderable by the OKF visualizer, ingestible by a knowledge catalog.

## On every resolved ticket, emit (close-the-loop):
1. **Lineage field** concept → `knowledge/fields/<es_field>.md` (or update it): the API→ES→Oracle edge + freshness.
2. **Defect pattern** concept → `knowledge/defects/<pattern>.md` if the pattern is new; else link the ticket to it.
3. **Resolved ticket** concept → `knowledge/tickets/<JIRA-ID>.md` + a line in `knowledge/tickets/log.md`.
4. Cross-link everything (endpoint ↔ field ↔ table ↔ topic ↔ defect ↔ ticket). The links ARE the graph.

## Conformance (keep it valid)
- Every concept file has frontmatter with at least `type` (required by OKF). Prefer also
  `title, description, tags, timestamp`, and `resource` (link to the ODCS contract / Swagger / console).
- One concept per file; file path = identity. `index.md` per folder; `log.md` for history.

## Boundary (don't overclaim)
- OKF is **read context**, not enforcement. It does NOT validate drift — that's your ODCS/ODPS contracts.
- Link, don't duplicate: a concept's `resource:` points at the authoritative ODCS/OpenLineage artifact.
- It's a v0.1 single-vendor spec — treat `knowledge/` as an export/interchange layer; keep your structured
  catalog authoritative so spec churn can't strand you.
