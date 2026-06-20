---
type: Defect Pattern
title: Case mismatch on keyword term
description: term query on a keyword field is case-sensitive; query casing != stored casing → zero hits.
tags: [defect, elasticsearch, shrink]
timestamp: 2026-06-20T00:00:00Z
---
# Signature
Valid request, zero hits; shrink isolates a single keyword predicate; stored value differs only by case.
# Fix
Normalizer (lowercase) or case_insensitive:true, or lowercase keyword terms in the C# query builder.
# Seen in
[JIRA-5102](../tickets/JIRA-5102.md) on [GET /customers/search](../endpoints/customers-search.md).
