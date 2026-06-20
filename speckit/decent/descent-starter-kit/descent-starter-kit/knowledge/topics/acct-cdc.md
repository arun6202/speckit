---
type: Kafka CDC Topic
title: acct.cdc
description: OGG CDC for account tables. Keyed by primary key; commit-ordered per partition.
resource: TODO_topic_name
tags: [kafka, cdc, accounts]
timestamp: 2026-06-20T00:00:00Z
---
# Envelope
- op_type / op_ts (source trail) / pos / primary_keys / ${csn}. Key = ${primaryKeys}.
- Mode: TODO op vs tx (tx → NULL key breaks per-key reads).
# Merge
- temp_index → [acct_target](../indices/acct_target.md). Ordering: TODO external version on CSN (not LWW).
