# Rung 1 — Triage & scope

**Goal:** turn the Jira ticket into a typed `Scope` and prune context to one lineage subgraph.

Extract: env (prod / non-prod slot) · endpoint + module · record/business key · the consumer's exact
request · observed vs expected · severity · reproducible (y/n).

- Map endpoint → module → ES target index (see `docs/ai/endpoint-catalog.seed.md`).
- This is where pruning begins: from ~50 tables down to the lineage subgraph for THIS field.

**Gate:** ticket maps to a known endpoint + key? No → bounce as unactionable (ask the reporter for the request + key).
Yes → rung 2.
