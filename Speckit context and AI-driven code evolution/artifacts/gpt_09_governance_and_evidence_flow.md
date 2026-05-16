# GPT Governance and Evidence Flow

## Purpose

This diagram shows how serious AI-assisted work becomes reviewable and auditable.

```mermaid
flowchart TD
  A["AI-assisted output"] --> B{"Impact level?"}
  B -->|low| C["Peer review"]
  B -->|architecture| D["Enterprise architecture review"]
  B -->|security| E["Security review"]
  B -->|production| F["Production impact review"]

  C --> G["Evidence pack"]
  D --> G
  E --> G
  F --> G

  G --> H["Decision record"]
  H --> I["Risk register update"]
  I --> J["Adoption backlog update"]
  J --> K["Metrics update"]
  K --> L["Accepted workflow, skill, or gem"]
```

## Evidence Pack Contents

```mermaid
flowchart LR
  A["Source context"] --> P["AI Evidence Pack"]
  B["Prompt or workflow"] --> P
  C["Agent transcript"] --> P
  D["Generated artifact"] --> P
  E["Human review"] --> P
  F["Risk notes"] --> P
  G["Decision record"] --> P
  H["Follow-up backlog item"] --> P
```

## Governance Rule

Any AI output that influences architecture, migration, security, or production code must have an evidence pack.

