# AI Adoption Mermaid Diagrams

Source constraint: these diagrams are produced from `info.md` only.

## Brownfield Conversion Flow

```mermaid
flowchart LR
  A[Existing brownfield codebase] --> B[AI-assisted discovery]
  B --> C[Markdown notes]
  C --> D[Mermaid diagrams]
  C --> E[C4 diagrams]
  C --> F[CLLA logical-layer diagrams]
  D --> G[Workflow definitions]
  E --> G
  F --> G
  G --> H[Reusable skills]
  H --> I[GPT gems]
  I --> J[Governed enterprise reuse]
```

## Agent Debate Flow

```mermaid
sequenceDiagram
  participant CL as Change Lead Agent
  participant EA as Enterprise Architect Agent
  participant EE as Engineering Enablement Subagent
  participant GOV as Governance Subagent
  participant DOC as Documentation Subagent

  CL->>EA: Propose brownfield AI adoption phase
  EA->>EE: Validate engineering workflow impact
  EE->>DOC: Request markdown and diagram artifacts
  DOC->>GOV: Attach transcript and source assumptions
  GOV->>CL: Approve, revise, or escalate
  CL->>CL: Convert accepted pattern into backlog item
```

## Workflow-to-Skill Promotion

```mermaid
stateDiagram-v2
  [*] --> OneOffPrompt
  OneOffPrompt --> RepeatedPrompt: Used more than once
  RepeatedPrompt --> WorkflowSpec: Inputs and outputs become stable
  WorkflowSpec --> ReviewedWorkflow: Human review checklist added
  ReviewedWorkflow --> SkillCandidate: Value proven
  SkillCandidate --> GPTGem: Portable guidance packaged
  GPTGem --> GovernedReuse: Cataloged and maintained
```

## Documentation Publishing Flow

```mermaid
flowchart TD
  A[Agent transcript] --> B[Markdown artifact]
  C[Architecture notes] --> B
  D[Diagram source] --> B
  B --> E[Pandoc-ready document]
  E --> F[Team review]
  F --> G[Published playbook]
```

