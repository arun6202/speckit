# GPT Pandoc Publishing Flow

## Purpose

This diagram shows how markdown adoption artifacts become polished, shareable documents without losing source traceability.

```mermaid
flowchart TD
  A["Markdown source artifacts"] --> B["Diagram source included<br/>Mermaid, C4, CLLA"]
  B --> C["Transcript and decision links added"]
  C --> D["Assumptions and open questions checked"]
  D --> E["Human review"]
  E --> F{"Approved?"}
  F -->|no| G["Revise markdown source"]
  G --> D
  F -->|yes| H["Pandoc export"]
  H --> I["Published adoption pack"]
  I --> J["Versioned alongside source"]
```

## Publishing Inputs

- Adoption playbook
- Diagram markdown
- Agent transcript logs
- Workflow specs
- Skill and GPT gem catalogs
- Governance checklist
- Risk register
- Evidence packs
- Decision records

