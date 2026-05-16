# Skill Candidates

Source constraint: these skill candidates are produced from `info.md` only.

## Candidate 1: Brownfield Discovery Skill

Use when a team begins AI-assisted understanding of a large existing codebase.

Inputs:

- Scope
- Source context
- Known concerns

Outputs:

- Markdown discovery notes
- Assumption log
- Open questions
- First-pass Mermaid diagram

Promotion criteria:

- Produces useful notes across several brownfield areas.
- Separates confirmed facts from assumptions.
- Supports human review.

## Candidate 2: Architecture Diagram Skill

Use when markdown notes need to become Mermaid, C4, and CLLA diagrams.

Inputs:

- Discovery notes
- Actors
- Systems
- Workflows

Outputs:

- Mermaid flow
- C4 context and container views
- Logical-layer diagram

Promotion criteria:

- Diagrams remain readable.
- Diagrams are source-grounded.
- Diagrams help decision-making.

## Candidate 3: Agent Debate Skill

Use before major adoption, architecture, or workflow decisions.

Inputs:

- Proposal
- Constraints
- Roles

Outputs:

- Debate transcript
- Options
- Recommendation
- Risks

Promotion criteria:

- Reveals tradeoffs.
- Produces actionable next steps.
- Creates a useful governance record.

## Candidate 4: Markdown Publishing Skill

Use when artifacts need to be converted into shareable enterprise documents.

Inputs:

- Markdown source
- Diagram source
- Publishing target

Outputs:

- Pandoc-ready markdown
- Table of contents
- Export checklist

Promotion criteria:

- Reduces publishing friction.
- Preserves traceability.
- Keeps review comments visible.

## Candidate 5: AI Evidence Pack Skill

Use when an AI-assisted decision or output may affect architecture, migration, security, or production work.

Inputs:

- Prompt or workflow
- Source context
- Agent transcript
- Generated artifact
- Human review

Outputs:

- Evidence pack
- Risk note
- Decision record link
- Backlog follow-up

Promotion criteria:

- Makes AI output auditable.
- Helps future teams understand why a decision was made.
- Reduces governance ambiguity.

