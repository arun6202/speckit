# C4 Model for Brownfield AI Adoption

Source constraint: this model is produced from `info.md` only.

This is a C4-style model for the AI adoption system itself. It does not claim details about any specific codebase internals.

## Level 1: System Context

```mermaid
C4Context
  title Brownfield Enterprise AI Adoption Context

  Person(engineer, "Engineer", "Uses AI to understand, document, test, and evolve existing systems.")
  Person(architect, "Enterprise Architect", "Owns architecture understanding and modernization direction.")
  Person(changeLead, "Change Lead", "Owns adoption rollout and team transition.")
  Person(governance, "Governance Reviewer", "Reviews traceability, risk, and enterprise readiness.")

  System(aiAdoption, "AI Adoption System", "A repeatable operating model for moving from casual AI usage to governed enterprise AI-assisted engineering.")

  Rel(engineer, aiAdoption, "Uses workflows and gems")
  Rel(architect, aiAdoption, "Creates diagrams and decision records")
  Rel(changeLead, aiAdoption, "Manages roadmap and backlog")
  Rel(governance, aiAdoption, "Reviews evidence packs")
```

## Level 2: Container View

```mermaid
C4Container
  title AI Adoption System Containers

  Person(team, "Delivery Team", "Engineers, architects, reviewers, and leads.")

  System_Boundary(adoption, "AI Adoption System") {
    Container(playbook, "Adoption Playbook", "Markdown", "Defines principles, roadmap, and operating model.")
    Container(diagrams, "Diagram Library", "Mermaid/C4/CLLA", "Stores architecture and adoption diagrams.")
    Container(workflows, "Workflow Catalog", "Markdown", "Defines repeatable AI-assisted work.")
    Container(gems, "GPT Gems Catalog", "Markdown", "Packages reusable expert assistants.")
    Container(evidence, "Evidence Packs", "Markdown", "Links source context, transcript, output, review, and decisions.")
    Container(roadmap, "Roadmap Visualization", "JSX", "Visualizes adoption phases, roles, outputs, and risks.")
  }

  Rel(team, playbook, "Reads and updates")
  Rel(team, diagrams, "Creates and reviews")
  Rel(team, workflows, "Executes")
  Rel(workflows, gems, "Promotes stable patterns into")
  Rel(workflows, evidence, "Produces")
  Rel(playbook, roadmap, "Summarized by")
```

## Level 3: Component View

```mermaid
flowchart TD
  A[Source Context] --> B[Agent Debate]
  B --> C[Transcript Log]
  C --> D[Artifact Draft]
  D --> E[Human Review]
  E --> F[Decision Record]
  F --> G[Workflow Update]
  G --> H[Skill or Gem Candidate]
```

## Level 4: Code View Placeholder

No code-level model is defined yet. The code-level view should be generated only after inspecting a real brownfield codebase and should remain grounded in observed files and runtime behavior.

