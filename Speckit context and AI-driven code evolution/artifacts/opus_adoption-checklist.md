# AI Adoption Readiness Checklist — Week 24 Assessment

**Target path in repo**: `/docs/ai-adoption/readiness-checklist.md`  
**Owner**: @arch-lead  
**Assessment date**: {YYYY-MM-DD}  
**Phase completed through**: Phase 4 (Enterprise Integration)

---

## How to Use This Checklist

Run this assessment at Week 24 (end of Phase 4). Each item is Yes/No with evidence required.
A "No" with documented mitigation is acceptable. An unanswered "No" is a risk.

Target scores: Green ≥ 90%, Yellow 70–89%, Red < 70%.

---

## Phase 0: Architecture Literacy ✅

| Item | Status | Evidence |
|---|---|---|
| C4 Context diagram exists and is verified | ☐ Yes / ☐ No | Link to `context.md` + last verification date |
| C4 Container diagram exists and is verified | ☐ Yes / ☐ No | Link to `container.md` + last verification date |
| Checkout sequence diagram exists and is verified | ☐ Yes / ☐ No | Link to `sequence-checkout.md` |
| Plugin event sequence diagram exists and is verified | ☐ Yes / ☐ No | Link to `sequence-plugin-events.md` |
| Refund sequence diagram exists and is verified | ☐ Yes / ☐ No | Link to `sequence-refund.md` |
| FRESHNESS.md register maintained | ☐ Yes / ☐ No | No diagram stale > 90 days |
| Discovery run completed (full codebase scan) | ☐ Yes / ☐ No | Discovery run date + findings documented |
| All undocumented integrations found and documented | ☐ Yes / ☐ No | C4 Context lists all external systems |
| ADR-000 (diagram tooling) accepted and in repo | ☐ Yes / ☐ No | `/docs/adr/ADR-000-diagram-tooling.md` exists |

**Phase 0 score**: \_\_ / 9

---

## Phase 1: Markdown Documentation ✅

| Item | Status | Evidence |
|---|---|---|
| ADR-001 (event handler ordering) accepted | ☐ Yes / ☐ No | `/docs/adr/ADR-001-event-handler-ordering.md` |
| ADR-002 (StoreId semantics) accepted | ☐ Yes / ☐ No | `/docs/adr/ADR-002-settings-storeid.md` |
| Plugin settings runbook exists | ☐ Yes / ☐ No | `/docs/runbooks/plugin-settings-not-loading.md` |
| Cache invalidation runbook exists | ☐ Yes / ☐ No | `/docs/runbooks/cache-invalidation.md` |
| Event handler failures runbook exists | ☐ Yes / ☐ No | `/docs/runbooks/event-handler-failures.md` |
| All ADRs have incident evidence (not just rationale) | ☐ Yes / ☐ No | Each ADR has incident history table |
| Pandoc pipeline operational (MD → HTML) | ☐ Yes / ☐ No | CI builds HTML docs on main push |
| Ops team has reviewed runbooks | ☐ Yes / ☐ No | Sign-off from ops representative |
| Claude Code PR hook active (ADR proposal on structural changes) | ☐ Yes / ☐ No | `.github/workflows/adr-proposal.yml` exists |

**Phase 1 score**: \_\_ / 9

---

## Phase 2: Code Skills and Context ✅

| Item | Status | Evidence |
|---|---|---|
| Root CLAUDE.md exists with all 6 laws | ☐ Yes / ☐ No | `/CLAUDE.md` contains LAW-1 through LAW-6 |
| LAW-1 (cache scope) tested in staging | ☐ Yes / ☐ No | Test showing multi-node invalidation works |
| LAW-2 (StoreId semantics) verified in Setting + Order + Customer tables | ☐ Yes / ☐ No | ADR-002 evidence |
| LAW-3 (event handler threading) — 0 async handlers in codebase | ☐ Yes / ☐ No | CI check passes (handler-compliance check) |
| LAW-4 (settings read timing) — 0 Initialize() settings reads | ☐ Yes / ☐ No | Grep result: 0 matches for settings in Initialize() |
| LAW-5 (repository boundary) — 0 direct DbContext injections | ☐ Yes / ☐ No | Grep result: 0 NopDbContext injections outside Nop.Data |
| LAW-6 (stock concurrency) — optimistic retry in InventoryPlugin | ☐ Yes / ☐ No | Code review of InventoryPlugin |
| `cache-aside-multi-store` skill file exists | ☐ Yes / ☐ No | `/skills/cache-aside-multi-store.md` |
| `plugin-event-consumer` skill file exists | ☐ Yes / ☐ No | `/skills/plugin-event-consumer.md` |
| `plugin-settings` skill file exists | ☐ Yes / ☐ No | `/skills/plugin-settings.md` |
| `repository-pattern` skill file exists | ☐ Yes / ☐ No | `/skills/repository-pattern.md` |
| All skills linked from CLAUDE.md | ☐ Yes / ☐ No | CLAUDE.md has links to all skill files |
| SpecKit spec for OrderPlacedEvent exists | ☐ Yes / ☐ No | `/specs/order-placed-event.yaml` |
| AI-generated code review shows law compliance | ☐ Yes / ☐ No | Last 5 PRs with AI-generated code reviewed |

**Phase 2 score**: \_\_ / 14

---

## Phase 3: Workflow Automation ✅

| Item | Status | Evidence |
|---|---|---|
| Task spec template in use | ☐ Yes / ☐ No | `/tasks/TEMPLATE.md` + 3+ completed task specs |
| Opus (Planner) / Sonnet (Runner) boundary respected | ☐ Yes / ☐ No | Review of last 5 task specs |
| ARCH-EXCEPTION rate < 2 per feature cycle | ☐ Yes / ☐ No | Transcript analysis |
| ARCH-EXCEPTIONs reviewed within 1 week | ☐ Yes / ☐ No | No pending ARCH-EXCEPTIONs older than 7 days |
| MCP PluginRegistry server running (read-only) | ☐ Yes / ☐ No | `speckit mcp status` shows OK |
| MCP SchemaInspector server running (read-only) | ☐ Yes / ☐ No | `speckit mcp status` shows OK |
| Session transcripts written for all Sonnet sessions | ☐ Yes / ☐ No | `/transcripts/` directory has entries |
| 0 AI-sourced production incidents since Phase 3 start | ☐ Yes / ☐ No | Incident log reviewed |
| First full feature cycle completed without human corrective intervention | ☐ Yes / ☐ No | Feature: {name}, completed: {date} |

**Phase 3 score**: \_\_ / 9

---

## Phase 4: Enterprise Integration ✅

| Item | Status | Evidence |
|---|---|---|
| SpecKit CI gate active on all plugin PRs | ☐ Yes / ☐ No | `.github/workflows/speckit-gate.yml` active |
| Hard fail on new API without spec | ☐ Yes / ☐ No | Test: create plugin without spec → PR blocked |
| Warning on spec drift | ☐ Yes / ☐ No | Test: change handler without bumping spec → warning |
| ARCH-EXCEPTION logged to review queue | ☐ Yes / ☐ No | `docs/arch-exceptions/pending-review.md` exists |
| SpecKit coverage ≥ 90% | ☐ Yes / ☐ No | `speckit report coverage` output |
| spec-drafter agent (Haiku) active on PR creation | ☐ Yes / ☐ No | `.github/workflows/spec-drafter.yml` active |
| Monthly Opus review cadence established | ☐ Yes / ☐ No | Calendar invite: first Monday monthly |
| Last monthly review produced ≥ 1 approved update | ☐ Yes / ☐ No | Review notes from last session |
| CLAUDE.md + skills updated from review findings | ☐ Yes / ☐ No | Git history shows post-review updates |
| Source generators for new plugins (optional, advanced) | ☐ Yes / ☐ No | At least 1 plugin using generated settings class |
| 0 bypasses of CI gate in last 30 days | ☐ Yes / ☐ No | `docs/speckit-bypasses.md` — 0 entries in last 30d |
| Ops team cannot distinguish AI-generated from human-generated PRs | ☐ Yes / ☐ No | Ops team survey / blind review exercise |

**Phase 4 score**: \_\_ / 12

---

## Weekly Metrics (Track from Phase 3 Onwards)

| Metric | Target | Week 20 | Week 22 | Week 24 |
|---|---|---|---|---|
| ARCH-EXCEPTION rate (per feature cycle) | ≤ 1.0 | | | |
| SpecKit coverage % | ≥ 90% | | | |
| AI-sourced production incidents | 0 | | | |
| Avg feature cycle time (Opus spec → PR merge) | ≤ 3 days | | | |
| Spec drift warnings in last 30 days | ≤ 3 | | | |
| CI gate bypass count in last 30 days | 0 | | | |
| CLAUDE.md law changes since last month | Track | | | |
| New skills added since last month | Track | | | |

---

## Green / Yellow / Red Scoring

| Phase | Max Score | Green (≥90%) | Yellow (70-89%) | Red (<70%) |
|---|---|---|---|---|
| Phase 0 | 9 | ≥ 8 | 6–7 | ≤ 5 |
| Phase 1 | 9 | ≥ 8 | 6–7 | ≤ 5 |
| Phase 2 | 14 | ≥ 13 | 10–12 | ≤ 9 |
| Phase 3 | 9 | ≥ 8 | 6–7 | ≤ 5 |
| Phase 4 | 12 | ≥ 11 | 8–10 | ≤ 7 |
| **Total** | **53** | **≥ 48** | **36–47** | **≤ 35** |

---

## What "Done" Looks Like

The program is mature when:

1. **Ops never sees the AI layer** — PRs look like normal developer PRs. Code quality and test coverage are indistinguishable from human-written code.

2. **The laws are habits** — developers recall LAW-3 before writing a handler without reading CLAUDE.md. The laws are in the team's vocabulary.

3. **Incidents trend to zero** — no P0 or P1 incident traceable to AI-generated code for 3+ months.

4. **The system self-maintains** — monthly Opus review updates CLAUDE.md and skills without manual curation. New incidents automatically become new laws.

5. **Phase 4 is the operating mode, not the destination** — the 24-week program ends, but the cycle (feature → spec → Sonnet → transcript → Opus review → updated laws) runs indefinitely.
