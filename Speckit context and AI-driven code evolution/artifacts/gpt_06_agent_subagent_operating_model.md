# GPT Agent and Subagent Operating Model

## Purpose

This diagram defines how agents and subagents collaborate during actual adoption work.

```mermaid
sequenceDiagram
  autonumber
  participant User as Human Owner
  participant CL as Change Lead Agent
  participant EA as Enterprise Architect Agent
  participant EE as Engineering Enablement Subagent
  participant DOC as Documentation Subagent
  participant GOV as Governance Subagent
  participant MIG as Migration Subagent

  User->>CL: Submit adoption problem or work item
  CL->>EA: Ask for architecture impact and brownfield strategy
  EA->>EE: Validate engineering workflow and reuse potential
  EE->>DOC: Request markdown, diagram, and publishing structure
  DOC->>GOV: Attach source context and transcript draft
  GOV->>MIG: Check incremental modernization and rewrite risk
  MIG-->>GOV: Return migration risk and safer sequence
  GOV-->>CL: Return review notes and required controls
  CL-->>User: Present recommendation, artifacts, and backlog action
```

## Role Contract

| Role | Must Produce | Must Avoid |
| --- | --- | --- |
| Change Lead Agent | Phase plan, backlog item, adoption decision | Tool-only thinking |
| Enterprise Architect Agent | C4/CLLA impact, modernization guidance | Rewrite-first assumptions |
| Engineering Enablement Subagent | Workflow and skill candidates | One-off prompt dependency |
| Documentation Subagent | Markdown and diagram hygiene | Unreviewable outputs |
| Governance Subagent | Evidence, risk, review checklist | Untraceable approvals |
| Migration Subagent | Incremental path and test discovery | Big-bang modernization |

