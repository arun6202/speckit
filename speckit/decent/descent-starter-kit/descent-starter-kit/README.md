# Descent Starter Kit

A Claude-native, just-in-time (JIT) troubleshooting workspace for the pipeline:

```
Oracle (SoR) → F# ETL fsproj → Elasticsearch (target index) → C# Web API (Swagger)
                                     ↑ merge
            GoldenGate CDC → Kafka → temp ES index           ← realtime path
```

No reliable documentation is assumed. The system documents itself one ticket at a time:
every resolved ticket leaves behind a lineage fragment, a property test, and a rule.

## What's in here

| Path | What it is | State |
|---|---|---|
| `CLAUDE.md` | Always-loaded operating discipline | **Ready** (tune wording) |
| `.claude/rules/` | Stable rules split by domain | **Ready** (tune to your repo) |
| `.claude/skills/pipeline-descent/` | The descent + shrink protocol as a skill (progressive disclosure) | **Ready** (skeleton) |
| `.claude/skills/oracle-es-mapping/` | Pointer to your existing mapping skill | **Stub** |
| `.claude/agents/lineage-resolver.md` | Subagent that reads the ETL fsproj and returns typed lineage | **Ready** (skeleton) |
| `.claude/hooks/` | Read-only guard (PreToolUse) | **Ready** (verify wiring) |
| `.claude/settings.json` | Hook wiring template | **Stub** — verify against your Claude Code version |
| `fsx/` | F# diagnostic micro-tools (`.fsx`) | **Skeleton** — plug in your clients |
| `docs/ai/` | Seed catalogs Claude reads JIT | **Stub** — you fill from reality |
| `tickets/` | Per-ticket evidence template | **Ready** |
| `the-descent.html` | The field guide (the full reference) | **Ready** |

> **Legend.** *Ready* = use as-is, light tuning. *Skeleton* = correct shape, plug in env-specific bits.
> *Stub* = filename + brief intent; you take it forward. Every stub says what it should become.

## First 30 minutes

1. Read `the-descent.html` (open in a browser) — it's the whole protocol.
2. Drop `CLAUDE.md` + `.claude/` into your repo root. Adjust paths/names to match.
3. Wire the read-only hook (`.claude/hooks/block-writes.sh`) — see `.claude/settings.json`.
4. Fill `docs/ai/known-envs.md` and `fsx/connections.template.json` with your hosts (read creds only).
5. Take ONE real Jira defect. Copy `tickets/TEMPLATE.evidence.md` → `tickets/<JIRA-ID>/NOTES.md`. Run the descent.

## The one rule that matters most

Probes are **read-only** in every environment, prod and non-prod. The hook enforces it;
the F# `ReadOnly<'conn>` type makes a write *unrepresentable*. Fixes go: plan → approval → reviewed script → execution.

## Reliability layer (added from the 6-patterns review)

The kit now maps the six production-reliability patterns onto the descent — with the costs/when-not the
generic version omits:

- **Reflection** → rung 7 (`rungs/07-verdict-reflection.md`): falsify the verdict before committing.
- **Plan & Execute** → the rung plan + plan mode; gates allow replanning.
- **Layered memory** → `docs/ai/memory-layers.md`, always paired with pruning (forgetting).
- **Tool design** → typed, single-purpose, read-only fsx probes.
- **Human in the loop** → writes/fixes gated by `prod-safety.md`; investigation stays autonomous.
- **Eval suite** → `evals/` (hard-ticket set + scoring) + per-ticket regression properties in CI.

Detail: `.claude/rules/agent-reliability.md` and `.claude/skills/pipeline-descent/reference/reliability-patterns.md`.
What this kit adds beyond the six: **context pruning** and a **typed stopping rule**, which keep the loops from compounding.

## Knowledge capture as OKF

The descent's residue now lives in `knowledge/` as a conformant **Open Knowledge Format (OKF v0.1)** bundle —
markdown concepts with YAML frontmatter, cross-linked into a lineage/defect/ticket graph. Portable,
agent- and human-readable, renderable by the OKF visualizer, ingestible by a knowledge catalog. It is the
*context* layer; it links to (does not replace) your ODCS/ODPS/OpenLineage contracts. See `knowledge/README.md`.
