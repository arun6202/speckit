---
type: Lineage Field
title: acct_target.bal_minor
description: Account balance in minor units. API 'balance' ← this ES field ← Oracle ACCT_BAL.BAL_MINOR.
tags: [lineage, accounts, balance, realtime]
timestamp: 2026-06-20T00:00:00Z
---
# Edge
| API field | ES field | F# fn | Oracle | Rule | Freshness |
|---|---|---|---|---|---|
| balance | acct_target.bal_minor | AccountProjection.balMinor | [ACCT_BAL](../tables/acct_bal.md).BAL_MINOR | minor units | batch + [acct.cdc](../topics/acct-cdc.md) |
- Exposed by [GET /accounts/{id}/balance](../endpoints/account-balance.md). Confidence: confirmed (JIRA-4127).
