# GPT C4 Container Diagram

## Purpose

This C4 container view shows the main artifact containers in the adoption operating system.

```mermaid
C4Container
  title AI Adoption Operating System Containers

  Person(team, "Delivery Team", "Engineers, architects, change leads, reviewers, and documentation owners.")

  System_Boundary(adoption, "AI Adoption Operating System") {
    Container(playbook, "Adoption Playbook", "Markdown", "Operating principles, adoption roadmap, role model, and standards.")
    Container(diagramLibrary, "Diagram Library", "Markdown + Mermaid", "Mermaid, C4, CLLA, workflow, governance, and rollout diagrams.")
    Container(transcripts, "Transcript Archive", "Markdown", "Agent and subagent debate logs.")
    Container(workflows, "Workflow Catalog", "Markdown", "Repeatable AI-assisted work definitions.")
    Container(skills, "Skill Candidates", "Markdown", "Mature workflows ready to become skills.")
    Container(gems, "GPT Gem Catalog", "Markdown", "Reusable expert assistants and packaged guidance.")
    Container(evidence, "Evidence Packs", "Markdown", "Source context, prompt, transcript, output, review, risk, and decision links.")
    Container(backlog, "Adoption Backlog", "Markdown", "Pilot, rollout, review, publishing, and maturity tasks.")
    Container(metrics, "Metrics Dashboard Spec", "Markdown", "Adoption, quality, reuse, and governance metrics.")
  }

  Rel(team, playbook, "Reads and updates")
  Rel(team, diagramLibrary, "Creates and reviews")
  Rel(team, transcripts, "Logs reasoning in")
  Rel(workflows, skills, "Promotes stable workflows into")
  Rel(skills, gems, "Packages reusable patterns as")
  Rel(workflows, evidence, "Produces governance evidence")
  Rel(evidence, backlog, "Creates follow-up work")
  Rel(metrics, playbook, "Feeds improvements into")
```

## Container Rule

Every serious AI-assisted activity should create or update one of these containers. If it creates none, it is probably just informal experimentation.

