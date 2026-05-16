# ADR-000 — Diagram Tooling: Mermaid as Primary Architecture Diagram Format

**Target path in repo**: `/docs/adr/ADR-000-diagram-tooling.md`  
**Status**: Accepted  
**Date**: 2026-05-16  
**Deciders**: @arch-lead, @senior-dev-1, @senior-dev-2  
**Supersedes**: None (first ADR)

---

## Context

The team had no documented architecture before the Phase 0 discovery run. Several formats were considered to capture the discovered architecture (Avalara, Azure AD SSO, plugin event dispatch, checkout sequence). The team needed a format that:

1. Could be reviewed and corrected via standard PR workflow
2. Was renderable without a separate tool license
3. Could be generated and verified by Claude Code (no binary format)
4. Would survive the project for 3+ years without tooling rot

Candidates evaluated: Mermaid, PlantUML, Structurizr DSL, Lucidchart, draw.io XML.

---

## Decision

**Use Mermaid as the primary format for all architecture diagrams.**

Specific diagram types mapped to Mermaid syntax:
- C4 Context → `C4Context` block (Mermaid C4 extension)
- C4 Container → `C4Container` block
- C4 Component → `C4Component` block
- Sequence diagrams → `sequenceDiagram` block
- State machines → `stateDiagram-v2` block
- Directed graphs → `graph TD` block

All diagram files live in `/docs/architecture/`. File naming: `{type}-{subject}.md` (e.g., `sequence-checkout.md`).

---

## Rationale

| Criterion | Mermaid | PlantUML | Structurizr | Lucidchart |
|---|---|---|---|---|
| PR-reviewable (plain text) | ✅ | ✅ | ✅ | ❌ (binary) |
| GitHub native rendering | ✅ | ❌ (plugin) | ❌ | ❌ |
| Claude Code readable/writable | ✅ | ✅ | ✅ | ❌ |
| C4 model support | ✅ (extension) | ✅ | ✅ (native) | Partial |
| Sequence diagram support | ✅ | ✅ | ❌ | ✅ |
| Zero license cost | ✅ | ✅ | Partial | ❌ |
| Survives tool vendor exit | ✅ | ✅ | Moderate | Low |

**Key deciding factor**: GitHub renders Mermaid natively in `.md` files. PRs, wikis, and issue comments all render without plugin. No tool to install. No export step. Diagrams stay alive in review comments, which is where most architecture discussion happens.

**Secondary factor**: Claude Code (Opus 4.7) generates and validates Mermaid fluently. During the discovery run, Opus produced all five diagrams in a single session from code analysis alone. PlantUML would have required a separate server to validate rendering.

---

## Discovery-Before-Diagram Principle

This ADR also establishes the **discovery-before-diagram principle**: no architecture diagram is created from team memory or assumptions. Every diagram must be generated from, or verified against, a code analysis run.

Process:
1. Run Claude Code discovery against the relevant source directory
2. Generate diagram from discovered code behavior
3. Manual verification by a human reviewer against staging traces or ILSpy reflection
4. Record in FRESHNESS.md

**Evidence**: The initial discovery run found 2 external integrations (Avalara, Azure AD SSO) that were not in the team's mental model. Diagramming from memory would have produced an incorrect C4 Context. Code-first diagramming is the only reliable approach for brownfield systems.

---

## Freshness Policy

Architecture diagrams degrade. The discovery-before-diagram principle is a one-time fix; freshness requires a recurring process.

Policy:
- Every diagram has a `Next review due` date: 90 days from last verification
- FRESHNESS.md tracks all diagrams centrally
- Stale diagrams block PRs touching the relevant subsystem (CI check enforced)
- Full discovery re-run every 6 months or on major nopCommerce version upgrade

See FRESHNESS.md for the current register.

---

## Consequences

**Positive**:
- All architecture documentation is PR-reviewable plain text
- GitHub renders diagrams without tooling
- Claude Code can generate, update, and verify diagrams in-session
- Discovery-first approach catches undocumented integrations

**Negative**:
- Mermaid C4 extension is not official C4 — some C4 notation (relationship labels, boundary styles) differs from reference implementation
- Complex sequence diagrams with many participants hit Mermaid rendering limits (~15 participants before layout degrades)
- No interactive zoom/pan for large diagrams — workaround: split into sub-diagrams at subsystem level

**Mitigations**:
- For Mermaid layout limits: split large diagrams into focused sub-diagrams (e.g., checkout payment path as separate file from cart validation)
- Document Mermaid C4 deviations from reference C4 in a notation guide linked from each C4 diagram

---

## Bypass Procedure

If a PR needs to merge before a stale diagram can be re-verified:
1. Add `[FRESHNESS-BYPASS]` to PR title
2. Get explicit @arch-lead sign-off in PR comments
3. Create a follow-up issue assigned to @arch-lead with the re-verification task
4. Bypass is logged automatically by CI — reviewed in monthly Ops meeting
