---
type: ES Index
title: acct_target
description: Target index the API reads. Denormalized; feels relational to consumers.
resource: TODO_es_alias_or_index
tags: [elasticsearch, target]
timestamp: 2026-06-20T00:00:00Z
---
# Notes
- Fed by [batch ETL] and merged from [temp_index](temp_index.md) via [acct.cdc](../topics/acct-cdc.md).
- _id construction: TODO — MUST match batch and realtime. See [fields](../fields/index.md).
