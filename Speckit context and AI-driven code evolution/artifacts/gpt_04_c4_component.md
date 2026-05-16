# GPT C4 Component Diagram

## Purpose

This component view shows how one AI-assisted adoption work item moves through the operating system.

```mermaid
flowchart TD
  A["Work Item Intake<br/>problem, scope, owner"] --> B["Source Context Collector<br/>code, docs, assumptions"]
  B --> C["Agent Debate Runner<br/>agents and subagents test options"]
  C --> D["Transcript Logger<br/>reasoning and tradeoffs stored in markdown"]
  D --> E["Artifact Generator<br/>notes, diagrams, workflows, or templates"]
  E --> F["Human Review Gate<br/>architecture, security, production, documentation"]
  F -->|accepted| G["Decision Record Writer"]
  F -->|revision needed| E
  G --> H["Evidence Pack Builder"]
  H --> I["Backlog and Metrics Updater"]
  I --> J["Workflow, Skill, or GPT Gem Candidate"]
```

## Component Responsibilities

| Component | Responsibility |
| --- | --- |
| Work Item Intake | Defines why the AI-assisted work exists |
| Source Context Collector | Prevents unsupported claims |
| Agent Debate Runner | Exposes tradeoffs before adoption |
| Transcript Logger | Preserves reasoning |
| Artifact Generator | Produces markdown-first outputs |
| Human Review Gate | Protects architecture, security, and production quality |
| Decision Record Writer | Captures accepted decisions |
| Evidence Pack Builder | Makes AI work auditable |
| Backlog and Metrics Updater | Turns learning into execution |

