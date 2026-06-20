---
type: API Endpoint
title: GET /customers/search
description: Customer search. Consumers query as if Oracle; served from ES index acct/cust target.
resource: TODO_swagger_url#/Customers/search
tags: [customers, search]
timestamp: 2026-06-20T00:00:00Z
---
# Operation
- Module: Customers · Index: [cust_target](../indices/acct_target.md) · Key: customerId
- Sample request: `{customerId, status, name, openedAfter}`
# Known defects
- [Case mismatch on keyword status](../defects/case-mismatch.md) (see [JIRA-5102](../tickets/JIRA-5102.md))
