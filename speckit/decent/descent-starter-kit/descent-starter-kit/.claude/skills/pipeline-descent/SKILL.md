---
name: pipeline-descent
description: Troubleshoot defects in the Oracle to Elasticsearch to C# Web API pipeline (with GoldenGate CDC and Kafka realtime). Use this whenever a Jira ticket reports wrong, missing, or stale API/search results, an endpoint returns "not found" for data that should exist, an Elasticsearch query returns zero hits unexpectedly, or data looks out of date. Use it even when the user just pastes a failing request or describes "the API is wrong" without naming this skill — this is the protocol for ALL pipeline defect triage. Runs read-only.
---

# Pipeline Descent — JIT defect troubleshooting

Triage every ticket as a **descent**: six gates from the symptom (a bad API response) down to the
root cause (Oracle source of record, a transform, or the realtime path). Stop at the first gate that
convicts. Load each layer's context only when the gate above it is green. **All probes are read-only.**

> Full visual reference: `the-descent.html` at the repo root. Domain rules: `.claude/rules/`.

## Before you start
- Confirm the env (prod / which non-prod slot) and that probes are read-only (they must be).
- Open a ticket evidence file: copy `tickets/TEMPLATE.evidence.md` to `tickets/<JIRA-ID>/NOTES.md` and append findings as you go.

## The six rungs (read the matching file in `rungs/` when you reach that rung)
1. **Triage & scope** → `rungs/01-triage.md`
2. **Reproduce & validate — and if zero hits, SHRINK** → `rungs/02-reproduce-and-shrink.md`  ← most tickets resolve here
3. **Lineage (lookup from ETL fsproj; reads C# ⚠️)** → `rungs/03-lineage.md`
4. **System of record (Oracle = ground truth)** → `rungs/04-system-of-record.md`
5. **Batch reconcile (re-run the transform)** → `rungs/05-batch-reconcile.md`
6. **Realtime trace (Oracle → Kafka → temp ES → target)** → `rungs/06-realtime-trace.md`
7. **Verdict reflection (critique → falsify → revise)** → `rungs/07-verdict-reflection.md`  ← before you commit a cause

## Decision flow
```
malformed request ........................ InvalidRequest        (stop, consumer-side)
valid request, zero hits ................. run THE SHRINK -> classify (rung 2)
valid request, wrong value ............... descend
API binds wrong ES field ................. ContractDrift         (stop)
Oracle wrong ............................. SorDataIssue          (stop, escalate to data owner)
Oracle right, transform output wrong ..... TransformDefect       (stop)
Oracle right, batch right, ES stale ...... RealtimeStale/Drop/Reorder (rung 6)
```

## The shrink, in one line
A valid query that returns nothing is a **failing counterexample**. Bisect its predicates (`ddmin`) to the
1-minimal set that still returns zero, then name *why* with `_analyze` / `_validate/query?rewrite=true` / `_explain`.
Deep dive: `reference/ddmin-shrink.md` and `reference/es-zero-hit-ladder.md`.

## Close the loop (capture knowledge as OKF)
Every verdict emits residue into the OKF bundle `knowledge/` (see `.claude/rules/knowledge-capture-okf.md`):
a **Lineage Field** concept, a **Defect Pattern** concept (if new), and a **Resolved Ticket** concept + a
`knowledge/tickets/log.md` line — all cross-linked. Plus a regression property (FsCheck/Expecto) in CI.
No residue, not done.

## Reliability
This protocol implements the six agent-reliability patterns (reflection, plan-execute, layered memory,
tool design, human-in-the-loop, eval suite). Mapping + tradeoffs: `reference/reliability-patterns.md`
and `.claude/rules/agent-reliability.md`. Score the protocol itself against `evals/`.

## Tools
F# `.fsx` micro-tools live in `fsx/`. Heavy fsproj reading → spawn the `lineage-resolver` subagent.
