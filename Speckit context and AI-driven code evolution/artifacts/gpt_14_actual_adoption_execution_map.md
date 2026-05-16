# GPT Actual Adoption Execution Map

## Purpose

This is the operating map for running actual adoption work on a brownfield project.

```mermaid
flowchart TD
  Start["Start: choose one brownfield adoption target"] --> Intake["Create adoption work item<br/>scope, owner, expected outcome"]
  Intake --> Source["Collect source context<br/>code, docs, tests, workflows, assumptions"]
  Source --> Debate["Run agent/subagent debate<br/>architecture, enablement, governance, documentation, migration"]
  Debate --> Transcript["Store transcript in markdown"]
  Transcript --> Draft["Produce artifact draft<br/>notes, diagrams, workflow, template, or decision"]
  Draft --> Review{"Human review gate"}
  Review -->|revise| Draft
  Review -->|approve| Evidence["Create AI evidence pack"]
  Evidence --> Decision["Write or update decision record"]
  Decision --> Backlog["Create backlog follow-up"]
  Backlog --> Metrics["Update adoption metrics"]
  Metrics --> Promotion{"Reusable pattern?"}
  Promotion -->|no| Next["Move to next adoption target"]
  Promotion -->|yes| Workflow["Create workflow spec"]
  Workflow --> Skill{"Stable across cases?"}
  Skill -->|no| Next
  Skill -->|yes| Gem["Promote to skill or GPT gem"]
  Gem --> Catalog["Add to enterprise catalog"]
  Catalog --> Next
  Next --> Start
```

## Definition of Done

An adoption work item is done only when:

- Source context or assumptions are recorded.
- Agent reasoning is logged.
- The artifact is markdown-first or reviewable.
- Human review is complete.
- Risks and decisions are captured.
- Follow-up work is visible.
- Reusable patterns are promoted only after they prove stable.

