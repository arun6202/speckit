# GPT Workflow to Skill to Gem

## Purpose

This diagram shows the promotion path from informal prompting to reusable enterprise AI capability.

```mermaid
stateDiagram-v2
  [*] --> CasualPrompt: engineer asks AI for help
  CasualPrompt --> RepeatedPrompt: same task appears again
  RepeatedPrompt --> WorkflowSpec: inputs, outputs, steps are defined
  WorkflowSpec --> ReviewedWorkflow: checklist and human review added
  ReviewedWorkflow --> SkillCandidate: useful across more than one case
  SkillCandidate --> ApprovedSkill: owner and guardrails assigned
  ApprovedSkill --> GPTGem: packaged as reusable assistant guidance
  GPTGem --> CatalogedReuse: added to enterprise gem catalog
  CatalogedReuse --> ImprovedPattern: metrics and feedback collected
  ImprovedPattern --> GPTGem: gem updated
```

## Promotion Gates

| Gate | Question |
| --- | --- |
| Prompt to Workflow | Has this task repeated enough to standardize? |
| Workflow to Skill | Are inputs, outputs, steps, and review points stable? |
| Skill to GPT Gem | Is the practice trusted enough for broad reuse? |
| GPT Gem to Catalog | Is there an owner, guardrail, and maintenance rule? |

