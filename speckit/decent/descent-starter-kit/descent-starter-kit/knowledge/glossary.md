---
type: Glossary
title: Pipeline glossary
description: House terms for the Oracle→ES→API pipeline and the descent protocol.
tags: [glossary]
timestamp: 2026-06-20T00:00:00Z
---

# Glossary
- **System of Record (SoR)** — Oracle. Ground truth.
- **System of Reference** — the ES target index the API serves.
- **The Descent** — the six-rung triage protocol. Runbook: [the-descent](runbooks/the-descent.md).
- **The Shrink** — query bisection (ddmin) to isolate the field that empties a search. Runbook: [the-shrink](runbooks/the-shrink.md).
- **op_ts / pos / csn** — OGG CDC ordering markers (source-trail ts / trail position / commit sequence number).
