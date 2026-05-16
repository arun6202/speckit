# GPT C4 Context Diagram

## Purpose

This C4 context view shows the people and systems around enterprise AI adoption.

```mermaid
C4Context
  title Enterprise AI Adoption Context

  Person(engineer, "Engineer", "Uses AI-assisted workflows to understand, document, test, and evolve brownfield systems.")
  Person(architect, "Enterprise Architect", "Owns architecture understanding, C4 views, modernization direction, and risk decisions.")
  Person(changeLead, "Change Lead", "Owns rollout, training, behavior change, and adoption backlog.")
  Person(governance, "Governance Reviewer", "Reviews source traceability, security impact, production impact, and evidence packs.")
  Person(docLead, "Documentation Lead", "Maintains markdown, diagrams, publishing, and playbook hygiene.")

  System(aiAdoptionSystem, "AI Adoption Operating System", "A markdown-first adoption system that converts brownfield knowledge into diagrams, workflows, skills, GPT gems, and governed enterprise reuse.")
  System_Ext(existingCode, "Existing Brownfield Codebase", "Current application code, tests, docs, architecture decisions, and team knowledge.")
  System_Ext(gptAssistants, "GPT Assistants and Gems", "Reusable expert assistants created from proven workflows.")
  System_Ext(publishing, "Publishing Toolchain", "Markdown and Pandoc-based publishing path.")

  Rel(engineer, aiAdoptionSystem, "Uses workflows and contributes findings")
  Rel(architect, aiAdoptionSystem, "Reviews architecture artifacts")
  Rel(changeLead, aiAdoptionSystem, "Manages phases and backlog")
  Rel(governance, aiAdoptionSystem, "Reviews evidence and risk")
  Rel(docLead, aiAdoptionSystem, "Maintains documentation quality")
  Rel(aiAdoptionSystem, existingCode, "Grounds recommendations in")
  Rel(aiAdoptionSystem, gptAssistants, "Promotes stable workflows into")
  Rel(aiAdoptionSystem, publishing, "Publishes reviewed artifacts through")
```

## Review Questions

- Is every AI-assisted recommendation grounded in existing code, documentation, or explicit assumptions?
- Is the human owner clear?
- Is production-impacting work reviewed before execution?

