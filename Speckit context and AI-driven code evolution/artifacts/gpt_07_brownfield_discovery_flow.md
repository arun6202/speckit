# GPT Brownfield Discovery Flow

## Purpose

This diagram shows how an existing codebase becomes adoption-ready knowledge.

```mermaid
flowchart TD
  A["Select brownfield area"] --> B["Collect source context<br/>code, docs, tests, existing workflows"]
  B --> C["AI-assisted summary"]
  C --> D["Separate confirmed facts from assumptions"]
  D --> E["Write markdown discovery notes"]
  E --> F["Create Mermaid flow diagrams"]
  E --> G["Create C4 context/container/component views"]
  E --> H["Create CLLA capability/logical/layer/actor views"]
  F --> I["Human architecture review"]
  G --> I
  H --> I
  I --> J["Open questions and risks"]
  J --> K["Adoption backlog items"]
```

## Discovery Output Checklist

- Markdown notes exist.
- Assumptions are marked.
- Diagrams answer specific questions.
- Agent transcript is linked.
- Risks are registered.
- Follow-up work is added to the backlog.

