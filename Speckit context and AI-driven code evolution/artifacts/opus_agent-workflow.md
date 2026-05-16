# Multi-Agent Orchestration Diagram

**Target path in repo**: `/docs/architecture/agent-workflow.md`  
**Owner**: @arch-lead  
**Status**: CURRENT  
**Verified**: 2026-05-16  
**Next review due**: 2026-08-16

---

## Planner / Runner / Observer Model

```mermaid
graph TD
  subgraph Human["Human Layer"]
    PM[Product Manager\nDefines feature requirements]
    TL[Tech Lead\nReviews ARCH-EXCEPTIONs\nApproves monthly Opus proposals]
    Dev[Developer\nApproves SpecKit drafts\nMerges PRs]
  end

  subgraph Planner["Planner — Claude Opus 4.7"]
    O1[Reads requirements]
    O2[Reads CLAUDE.md root]
    O3[Reads relevant skills + specs]
    O4[Drafts task spec\nTaskSpec.md with scope,\nconstraints, acceptance criteria]
    O5[Monthly: reads all transcripts\nProposes CLAUDE.md + skill updates]
    O1 --> O2 --> O3 --> O4
  end

  subgraph Runner["Runner — Claude Sonnet 4.6"]
    S1[Reads task spec\nScoped to this task only]
    S2[Reads CLAUDE.md root\n+ task-specific CLAUDE.md if exists]
    S3[Reads applicable skill files]
    S4[Reads applicable SpecKit specs]
    S5[Implements per task spec]
    S6{Scope issue\ndiscovered?}
    S7[Emit ARCH-EXCEPTION\nContinue or block per spec]
    S8[Write transcript\n/transcripts/TASK-ID.md]
    S1 --> S2 --> S3 --> S4 --> S5 --> S6
    S6 -->|Yes| S7 --> S8
    S6 -->|No| S8
  end

  subgraph Observer["Observer — Claude Haiku 4.5"]
    H1[Runs on PR creation trigger]
    H2[Reads diff + changed SpecKit specs]
    H3[Drafts spec for new plugin APIs\nor flags spec drift]
    H4[Posts draft as PR comment\nfor developer review]
    H1 --> H2 --> H3 --> H4
  end

  subgraph MCP["MCP Servers — Read-Only"]
    MR[PluginRegistry\nList all plugins, consumers,\ninterfaces, widget zones]
    MS[SchemaInspector\nInspect DB tables,\nFKs, column types]
    MR -.->|read| S5
    MS -.->|read| S5
  end

  PM -->|Feature brief| O1
  O4 -->|Task spec| S1
  S7 -->|ARCH-EXCEPTION batch| TL
  TL -->|Decision| O1
  Dev -->|PR created| H1
  H4 -->|Draft spec comment| Dev
  Dev -->|Approved spec| O3
  O5 -->|Update proposals| TL
  TL -->|Approved changes| O3
```

---

## Feature Cycle Sequence

```mermaid
sequenceDiagram
  autonumber
  participant PM as Product Manager
  participant TL as Tech Lead
  participant Opus as Opus 4.7 (Planner)
  participant Sonnet as Sonnet 4.6 (Runner)
  participant Haiku as Haiku 4.5 (Observer)
  participant CI as CI Gate
  participant Dev as Developer

  PM->>Opus: Feature brief (natural language)
  Note over Opus: Reads CLAUDE.md root\nReads relevant skills and specs\nChecks FRESHNESS.md for stale diagrams

  Opus->>Dev: Task spec (TASK-{ID}.md)\nScope, constraints, acceptance criteria,\napplicable laws, skill files, files to modify

  Dev->>Dev: Review task spec\nAsk Opus questions if scope is unclear

  Dev->>Sonnet: Execute task spec
  Note over Sonnet: Reads task spec\nReads CLAUDE.md root\nReads skill files listed in spec\nReads SpecKit specs for touched plugins

  alt ARCH-EXCEPTION discovered
    Sonnet->>Dev: [ARCH-EXCEPTION] notification
    Dev->>TL: Escalate for scope decision
    TL->>Opus: New brief with updated scope
    Opus->>Dev: Updated task spec
    Dev->>Sonnet: Continue with updated spec
  else Clean execution
    Sonnet->>Dev: Implementation complete
  end

  Sonnet->>CI: PR created
  CI->>Haiku: Trigger spec-drafter on PR creation
  Haiku->>CI: Draft SpecKit spec (or drift warning) as PR comment

  Dev->>Dev: Review Haiku's draft spec
  Dev->>CI: Approve/modify spec, merge PR

  CI->>CI: Run SpecKit gate\nHard fail: new API without spec\nWarning: spec drift\nInfo: ARCH-EXCEPTION log

  Sonnet->>Sonnet: Write session transcript\n/transcripts/TASK-{ID}.md

  Note over Opus: Monthly — reads all /transcripts/\nProposes CLAUDE.md + skill updates
  Opus->>TL: Monthly proposals\n(CLAUDE.md changes, new skills, ADR updates)
  TL->>Dev: Review and merge approved proposals
```

---

## ARCH-EXCEPTION Protocol

```mermaid
flowchart TD
  S([Sonnet discovers scope issue]) --> E[Emit ARCH-EXCEPTION block\nin current session output]
  E --> Q{Blocker or\ncontinue?}
  Q -->|BLOCKED| B[Stop execution\nWait for new task spec]
  Q -->|CONTINUING WITH WORKAROUND| C[Document workaround\nContinue task\nFlag in PR description]
  B --> TL[Batch to Tech Lead\nReviewed async]
  C --> TL
  TL --> R{Decision}
  R -->|Scope expanded| OS[Opus authors expanded task spec]
  R -->|Workaround accepted| PR[PR merges as-is\nARCH-EXCEPTION logged]
  R -->|Task cancelled| CX[Task closed\nNew brief issued]
  OS --> Sonnet[Sonnet re-executes with new spec]
```

An `[ARCH-EXCEPTION]` block looks like:

```
[ARCH-EXCEPTION]
Task: TASK-20260516-042
Issue: Adding loyalty points requires reading LoyaltyPlugin settings, but the existing
       LoyaltyPluginSettings class does not have a PointsEnabled flag — all orders
       get points unconditionally. Product requirement implies a toggle is needed.
Impact: Need a new setting + admin UI, which is explicitly out of scope for this task.
Recommendation: Either (a) expand scope to include setting + UI, or (b) implement
                unconditional points award for now and track UI as a follow-up task.
Status: CONTINUING WITH WORKAROUND — implemented unconditional points award.
        Created follow-up issue #234 for the toggle UI.
```

---

## Agent Roles and Model Assignments

| Role | Model | When Used | Context Loaded |
|---|---|---|---|
| **Planner** | Claude Opus 4.7 | Feature planning, task spec authoring, monthly review | CLAUDE.md root + all skills + all specs + recent transcripts |
| **Runner** | Claude Sonnet 4.6 | Task execution per spec | CLAUDE.md root + task-specific CLAUDE.md + skill files listed in spec + SpecKit spec for touched plugin |
| **Observer (spec-drafter)** | Claude Haiku 4.5 | Triggered on PR creation | PR diff + changed SpecKit specs + plugin-event-consumer skill |
| **Discovery** | Claude Opus 4.7 | Bi-annual codebase discovery run | Full codebase scan — no prior context loaded |
| **Diagram verifier** | Claude Sonnet 4.6 | Architecture diagram re-verification | Single diagram file + relevant source files |

---

## MCP Server Specifications (Read-Only)

### PluginRegistry MCP

Exposes the plugin registry — all loaded plugins, their consumers, widget zones, and interfaces.

```
Tool: list_plugins
Returns: [{SystemName, FolderName, Version, IsActive, Assembly}]

Tool: get_plugin_consumers(plugin_system_name)
Returns: [{EventType, HandlerClass, Priority, OrderAttribute}]

Tool: get_plugin_widget_zones(plugin_system_name)
Returns: [{ZoneName, ViewComponentName}]

Tool: get_event_consumers(event_type)
Returns: [{PluginSystemName, HandlerClass, Priority}] sorted by execution order
```

### SchemaInspector MCP

Exposes the SQL Server schema — tables, columns, foreign keys, indexes.

```
Tool: inspect_table(table_name)
Returns: {TableName, Columns:[{Name, Type, Nullable, DefaultValue}], FKs, Indexes}

Tool: find_tables_by_column(column_name)
Returns: [{TableName, ColumnName, ColumnType}]

Tool: get_migration_history()
Returns: [{MigrationId, AppliedOn}]
```

**Write capabilities**: Not exposed via MCP. All writes go through `IRepository<T>` in application code, not via MCP server tooling. This prevents AI-authored SQL from bypassing cache invalidation and soft-delete filters (LAW-5).

---

## Transcript Format

All Sonnet execution sessions produce a transcript at `/transcripts/TASK-{ID}.md`:

```markdown
# Session Transcript — TASK-{ID}

**Task**: {task title}
**Date**: {YYYY-MM-DD}
**Model**: claude-sonnet-4-6
**Duration**: {minutes}

## Context Loaded
- CLAUDE.md root (LAW-1 through LAW-6)
- Skills: {list}
- Specs: {list}

## Execution Summary
{3-5 sentences: what was done, in what order, any decisions made}

## ARCH-EXCEPTIONs
{None / or list with status}

## Files Modified
{list with change summary}

## Laws Applied
{Which laws were relevant and how they were applied}

## Open Questions
{Any ambiguity encountered that was resolved by assumption — for Opus monthly review}
```
