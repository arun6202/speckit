---
type: Runbook
title: The Shrink
description: ddmin over ES bool predicates (= FsCheck shrinking) to isolate the field/value that empties a search.
resource: ../../.claude/skills/pipeline-descent/reference/ddmin-shrink.md
tags: [runbook, shrink, elasticsearch]
timestamp: 2026-06-20T00:00:00Z
---
# Use when
A valid request returns zero hits. Bisect predicates → 1-minimal culprit → classify via
_analyze / _validate?rewrite / _explain. Ladder: zero-hit root causes by base rate (analyzer/term-vs-match first).
