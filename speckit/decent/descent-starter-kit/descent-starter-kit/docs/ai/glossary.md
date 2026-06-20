# Glossary (STUB — add your house terms)

- **SoR / System of Record** — Oracle. Ground truth.
- **SoReference / System of Reference** — the ES target index the API serves.
- **Target index / temp index** — target = what endpoints read; temp = CDC landing index before merge.
- **The Descent** — the six-rung triage protocol.
- **The Shrink** — query bisection (ddmin) to isolate the field/value that empties a search.
- **Lineage edge** — API field -> ES field -> Oracle table.column, with freshness path.
- **op_ts / pos / csn** — OGG CDC ordering markers (source trail ts / trail position / commit sequence number).
- TODO: add module names, index naming conventions, tenant terms, status code vocab, etc.
