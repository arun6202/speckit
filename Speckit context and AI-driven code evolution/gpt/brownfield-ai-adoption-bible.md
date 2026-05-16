# Brownfield AI Adoption Bible

Source constraint: this playbook was produced from `info.md` only.

## Purpose

This is a reference model for moving a team from casual or minimal AI usage into serious enterprise AI usage in a brownfield codebase. It is designed for large projects where existing code, documentation, architecture decisions, and team workflows already matter.

The roadmap is not a rewrite plan. It is a conversion plan: existing code and team knowledge become diagrams, markdown, workflows, skills, governance evidence, and reusable GPT gems.

## Core Principle

AI adoption should be grounded in the current system before it becomes automation.

The sequence is:

1. Understand the existing system.
2. Capture knowledge in markdown.
3. Visualize architecture with Mermaid, C4, and CLLA or logical-layer diagrams.
4. Convert repeated AI usage into workflows.
5. Convert stable workflows into reusable skills.
6. Package trusted patterns as GPT gems.
7. Govern the process with transcript logs and human review.

## Brownfield Roadmap

### Phase 1: Minimal AI Use

Goal: make ad hoc AI usage visible and inspectable.

Practices:

- Use AI to summarize existing code and documentation.
- Generate markdown exploration notes.
- Create first-pass Mermaid diagrams for flows and dependencies.
- Start C4 and CLLA or logical-layer diagrams for architectural understanding.
- Log agent and subagent reasoning in markdown.

Artifacts:

- Exploration notes
- Mermaid sketches
- Initial C4 and logical-layer diagrams
- Agent transcript logs

### Phase 2: Structured Brownfield Understanding

Goal: build a repeatable understanding layer over the existing system.

Practices:

- Use the codebase as the source of truth.
- Convert important findings into markdown architecture documents.
- Use C4 diagrams for context, container, component, and code-level views.
- Use Pandoc to turn markdown into shareable documents when needed.
- Capture assumptions, risks, and open questions in the same repository of artifacts.

Artifacts:

- Architecture markdown
- Diagram source files
- Decision records
- Pandoc-ready documentation

### Phase 3: Workflow Conversion

Goal: move from one-off prompting to repeatable AI-assisted work.

Practices:

- Identify repeated prompts used during code understanding, diagramming, testing, refactoring, and documentation.
- Define named agent and subagent roles.
- Create review checklists for AI-assisted output.
- Keep transcripts linked to generated artifacts.

Artifacts:

- Workflow definitions
- Agent role descriptions
- Subagent debate logs
- Human review checklists

### Phase 4: Skills and Enterprise Patterns

Goal: turn reliable workflows into reusable enterprise capability.

Practices:

- Convert mature workflows into skills.
- Package trusted guidance as GPT gems.
- Standardize markdown, diagram, review, and publishing conventions.
- Treat governance as lightweight evidence, not ceremony.

Artifacts:

- Skills
- GPT gems
- Workflow templates
- Adoption playbook

### Phase 5: Governed Enterprise Reuse

Goal: scale serious AI usage across large projects without losing traceability.

Practices:

- Maintain a catalog of accepted workflows and gems.
- Require source traceability for architecture and code recommendations.
- Use human approval for security, architecture, and production-impacting changes.
- Keep the roadmap artifact current as the team learns.

Artifacts:

- Enterprise AI adoption roadmap
- Markdown transcript archive
- Approved gem catalog
- Governance checkpoints

## Agent Model

Recommended agents:

- Enterprise Architect Agent: owns system shape, C4 diagrams, brownfield modernization strategy, and architectural risk.
- Engineering Enablement Agent: owns developer workflows, reusable skills, onboarding, and team adoption.
- Change Lead Agent: owns rollout sequence, team behavior change, training, and adoption metrics.
- Governance Subagent: owns traceability, review rules, security alignment, and auditability.
- Documentation Subagent: owns markdown, diagram hygiene, Pandoc readiness, and publishing.
- Migration Subagent: owns incremental modernization paths and rewrite avoidance.

## Review Checklist

- Is the AI output grounded in existing code or documented assumptions?
- Is the output captured in markdown or another reviewable artifact?
- Does the artifact include diagrams where architecture understanding is needed?
- Is the agent or subagent reasoning logged?
- Can this one-off prompt become a repeatable workflow?
- Can this workflow become a skill or GPT gem?
- Has a human reviewed production-impacting recommendations?
- Does the roadmap avoid rewrite-first thinking?

## Target Outcome

The team should end with a living adoption system:

- Markdown as the knowledge base.
- Mermaid, C4, and logical-layer diagrams as the shared visual language.
- Pandoc as the publishing path.
- Agent transcripts as decision evidence.
- Workflows and skills as reusable engineering practice.
- GPT gems as portable enterprise guidance.
- `ai-adoption-roadmap.jsx` as the visual anchor.
