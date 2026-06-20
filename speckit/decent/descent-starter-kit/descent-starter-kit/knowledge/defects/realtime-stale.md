---
type: Defect Pattern
title: Realtime staleness via merge lag
description: Oracle + batch correct; new value sits in temp_index; merge consumer lag delays target update.
tags: [defect, kafka, cdc, realtime]
timestamp: 2026-06-20T00:00:00Z
---
# Signature
Stale field shortly after a write; SoR correct; batch reproduces correct; rtTrace stops at target merge with lag.
# Fix / guard
Repair/scale the merge consumer; assert target.mergedAt − temp.indexedAt ≤ SLA (regression property).
Out-of-order variant → external version on CSN (not LWW).
# Seen in
[JIRA-4127](../tickets/JIRA-4127.md) on [GET /accounts/{id}/balance](../endpoints/account-balance.md).
