---
type: API Endpoint
title: GET /accounts/{id}/balance
description: Current account balance. Realtime-sensitive (CDC).
resource: TODO_swagger_url#/Accounts/balance
tags: [accounts, balance, realtime]
timestamp: 2026-06-20T00:00:00Z
---
# Operation
- Module: Accounts · Index: [acct_target](../indices/acct_target.md) · Key: accountId
- Field served: balance ← [acct_target.bal_minor](../fields/acct_target.bal_minor.md)
# Known defects
- [Realtime staleness via merge lag](../defects/realtime-stale.md) (see [JIRA-4127](../tickets/JIRA-4127.md))
