# Artifact Catalog

Source constraint: this catalog is produced from `info.md` only.

This catalog defines the essential artifact types for a brownfield enterprise AI adoption program. The goal is to move from casual AI use into serious, governed, reusable AI-assisted engineering.

## Core Artifacts

| Artifact | Purpose | Primary Owner | Format |
| --- | --- | --- | --- |
| AI Adoption Roadmap | Visual anchor for the adoption journey | Change Lead | JSX |
| Agent Debate Transcripts | Record reasoning, tradeoffs, and decisions | All agents | Markdown |
| Brownfield AI Adoption Bible | Main operating playbook | Enterprise Architect | Markdown |
| GPT Gems Catalog | Defines reusable expert assistants | Engineering Enablement | Markdown |
| Mermaid Flow Diagrams | Show flows, dependencies, and adoption process | Documentation Subagent | Markdown |
| C4 Model | Explain system context, containers, components, and code views | Enterprise Architect | Markdown |
| CLLA Model | Explain capability, logical, layer, and actor views | Enterprise Architect | Markdown |
| Workflow Specs | Convert repeated prompts into repeatable processes | Engineering Enablement | Markdown |
| Skill Candidates | Identify workflows ready to become skills | Engineering Enablement | Markdown |
| Governance Checklist | Keep AI-generated outputs reviewable and traceable | Governance Subagent | Markdown |
| Risk Register | Track adoption, security, architecture, and delivery risks | Governance Subagent | Markdown |
| Adoption Backlog | Convert roadmap ideas into actionable work | Change Lead | Markdown |
| Metrics Dashboard Spec | Define how adoption maturity will be measured | Change Lead | Markdown |
| Pandoc Publishing Guide | Convert markdown knowledge into shareable documents | Documentation Subagent | Markdown |
| Decision Record Template | Capture architecture and adoption decisions | Enterprise Architect | Markdown |

## New Essential Artifact Type

### AI Evidence Pack

The AI Evidence Pack is a bundled artifact for any serious AI-assisted change. It links the prompt or workflow, source context, agent transcript, generated output, human review, decision record, and follow-up backlog item.

This is essential because enterprise adoption fails when AI output cannot be traced. The Evidence Pack turns AI-assisted work into something auditable, teachable, and reusable.

Minimum contents:

- Source references or documented assumptions
- Agent and subagent transcript
- Generated artifact
- Human review note
- Risk assessment
- Decision record link
- Next action or backlog item

## Recommended Folder Shape

```text
gpt/
  ai-adoption-roadmap.jsx
  agent-subagent-debate-transcripts.md
  brownfield-ai-adoption-bible.md
  gpt-gems.md
  artifact-catalog.md
  diagrams/
  governance/
  workflows/
  templates/
  publishing/
  rollout/
  evidence-packs/
```

