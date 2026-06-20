---
type: Oracle Table
title: ACCT_BAL
description: Account balance source of record.
resource: TODO_ogg_or_db_link
tags: [oracle, accounts]
timestamp: 2026-06-20T00:00:00Z
---
# Columns (partial)
| Column | Meaning |
|---|---|
| ACCOUNT_ID | business key |
| BAL_MINOR | balance in minor units → [acct_target.bal_minor](../fields/acct_target.bal_minor.md) |
# CDC
- Changes flow via [acct.cdc](../topics/acct-cdc.md).
