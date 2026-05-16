# AI Governance Checklist

Source constraint: this checklist is produced from `info.md` only.

Use this checklist before accepting AI-generated artifacts into the enterprise adoption playbook.

## Source Grounding

- [ ] The artifact states its source context.
- [ ] Confirmed facts are separated from assumptions.
- [ ] Unsupported claims are removed or marked as hypotheses.
- [ ] Architecture claims are tied to observed evidence or explicit assumptions.

## Human Review

- [ ] A human owner reviewed the artifact.
- [ ] Security-impacting recommendations were escalated.
- [ ] Production-impacting recommendations were escalated.
- [ ] Architecture-impacting recommendations were reviewed by the enterprise architect.

## Documentation Quality

- [ ] The artifact is stored in markdown, JSX, or another reviewable format.
- [ ] Diagrams include source text, not only rendered images.
- [ ] The artifact has a clear owner.
- [ ] Open questions are documented.

## Workflow Reuse

- [ ] Repeated prompts are candidates for workflow specs.
- [ ] Stable workflows are candidates for skills.
- [ ] Mature skills are candidates for GPT gems.
- [ ] The artifact links to related transcripts or decisions.

## Governance Evidence

- [ ] Agent and subagent reasoning is logged.
- [ ] Risks are captured in the risk register.
- [ ] Decisions are captured in decision records.
- [ ] Follow-up work is captured in the adoption backlog.

