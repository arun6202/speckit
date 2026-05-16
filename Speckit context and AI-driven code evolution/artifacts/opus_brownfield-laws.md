# Brownfield AI Adoption Laws

**Target path in repo**: `/docs/ai-adoption/brownfield-laws.md`  
**Author**: Distilled by Opus 4.7 from 24-week adoption program analysis  
**Date**: 2026-05-16  
**Status**: AUTHORITATIVE — these apply to any brownfield AI adoption, not just nopCommerce

---

## The Five Brownfield Laws

These laws were synthesized across the full 24-week program. Each emerged from a failure mode observed when teams skipped a phase or reversed its order. They apply to any team adopting AI coding assistance in a production system with existing code, existing incidents, and existing tribal knowledge.

---

### LAW B-1: Never Greenfield-Rewrite

**Statement**: Treat the existing codebase as truth. Discover its behavior before changing it. Never replace a running system with an AI-designed rewrite.

**What this means in practice**:
- Before writing a line of code, run a discovery session: AI reads the codebase and explains what it does
- Diagrams are generated FROM the code, not FROM team memory or design docs
- Existing tests are the truth even when they seem wrong — they encode production constraints the team has forgotten
- Brownfield patterns (soft-delete via `Deleted` column, multi-store via `StoreId`, cache-aside via Redis) are adopted, not replaced with "better" alternatives

**What triggers this law**:
- An AI-generated implementation introduces a different ORM, a different cache pattern, or a different entity lifecycle than the existing codebase uses
- The team says "let's just rewrite this service" because the AI made it sound easy
- An AI suggests switching from a proven but old pattern to a new one without incident evidence that the old pattern is actually broken

**Why it exists**:
In the P0 discovery phase, Opus 4.7 found that the nopCommerce codebase uses soft-delete (`Deleted` column), multi-store scoping (`StoreId`), and optimistic concurrency (`RowVersion`) as first-class patterns across ~180 tables. An AI that was not constrained to discover first suggested replacing IRepository<T> with direct DbContext access for "simplicity." That suggestion would have broken 24 cache invalidation handlers silently.

**The test**: Would an experienced developer on this team, reading your AI-generated code, say "this looks like our codebase" or "who wrote this?" If the latter, LAW B-1 is being violated.

---

### LAW B-2: Each Phase Must Deliver Standalone Value

**Statement**: Every phase of AI adoption must produce something independently useful before the next phase begins. No phase exists only to enable the next phase.

**What this means in practice**:

| Phase | Standalone value | Team can stop here and still have gained |
|---|---|---|
| Phase 0: Architecture | Verified C4 diagrams + sequence diagrams | Team has documented architecture for the first time |
| Phase 1: Documentation | ADRs + runbooks | Ops team can diagnose known failures without paging a developer |
| Phase 2: Skills + Context | CLAUDE.md + skills | AI assistance produces law-compliant code consistently |
| Phase 3: Workflow | Planner/Runner boundary | Feature delivery with zero AI-sourced P0s |
| Phase 4: Enterprise | SpecKit CI gate | Self-maintaining spec coverage at scale |

**What triggers this law**:
- A team skips Phase 1 runbooks because "we'll document later" and then has an incident where ops cannot diagnose a plugin settings failure without developer help at 2am
- A team rushes to Phase 3 multi-agent workflow without Phase 2 CLAUDE.md laws, and Sonnet generates code that violates LAW-3 (async event handler) because the context was not in scope

**Why it exists**:
The ordering is not arbitrary. Phase 0 produces the discovery artifacts that make Phase 1 ADRs evidence-based (not memory-based). Phase 1 runbooks encode the same constraints that become Phase 2 CLAUDE.md laws. Phase 2 skills are what Phase 3 Sonnet reads before writing code. Each phase's outputs are the inputs to the next. Skipping is not accelerating — it is removing the foundation.

**The test**: If the company decided to freeze AI adoption after this phase, would the team have tangibly gained something they would not revert?

---

### LAW B-3: Existing Tests Are Truth

**Statement**: Never delete or modify an existing test to make AI-generated code pass. If the test is wrong, prove it from production evidence before removing it.

**What this means in practice**:
- AI-generated code must pass the existing test suite without modifying tests
- When AI-generated code fails a test that "seems wrong," investigate the test before changing the code — the test may encode a production constraint from an incident the team has forgotten
- Test coverage cannot be a deployment gate for AI-generated code unless the existing coverage baseline is maintained (AI-added features must add tests, not remove them)

**What triggers this law**:
- An AI suggests "this test is testing the wrong thing" and recommends deleting it
- AI-generated code changes a method signature that existing tests depend on, and the AI suggests updating the tests to match the new signature
- An AI disables a test with `[Skip]` or comments it out to get CI green

**Why it exists**:
In the P3 first feature cycle (category discount stacking), Sonnet's initial implementation failed `DiscountServiceTests.ShouldNotStackCategoryDiscounts`. The instinct was to update the test — the new behavior "makes sense." Investigation revealed the test was written after a 2024-Q4 incident where stacked discounts produced negative-price orders for some product bundles. The test was not wrong — it was encoding a non-obvious constraint. The implementation was fixed, not the test.

**The test**: When AI-generated code fails an existing test, the default question is "what is this test protecting?" not "is this test correct?"

---

### LAW B-4: Skills Encode the WHY, Not the WHAT

**Statement**: Skill files (context documents for AI) must capture the WHY behind a pattern — the incident that caused it, the invariant it protects — not just the WHAT (the code pattern). Without the WHY, the AI cannot judge when to apply the skill versus when a genuinely different situation warrants a different approach.

**What this means in practice**:
- Every CLAUDE.md law includes the incident or failure mode that produced it
- Skills reference ADRs and runbooks (the "why") not just code templates (the "what")
- When a skill says "always use RemoveAsync(specificKey)," it also says "because RemoveByPrefix is node-local on single-server and Redis-wide on multi-server, and we run 2-instance Azure App Service"
- Monthly Opus review adds new skills only when a new incident or new pattern has been observed — not proactively for "nice to have" patterns

**What triggers this law**:
- A skill file is a code template without explanation — it tells Sonnet WHAT to write but not WHY, so when Sonnet encounters a slightly different scenario, it cannot reason about whether the skill applies
- A skill is written speculatively ("we might someday need X") rather than from a real incident
- The WHY is in a comment inside the skill file that will get stripped when Sonnet generates code

**Why it exists**:
After the 2025-Q1 thread pool starvation incident (LAW-3), the initial skill file said "use void return type." A later Sonnet session, seeing a "fire-and-forget" scenario, used `Task.Run(() => ...)` because the skill said nothing about why async was prohibited. The WHY — "IEventPublisher calls HandleEvent synchronously on the request thread; async blocks the thread pool at scale" — is what allows Sonnet to reason that `Task.Run` is also prohibited, not just `async Task`.

**The test**: Could a smart developer who has never worked on this codebase read a skill file and understand why the pattern exists, and in what situations it does and does not apply?

---

### LAW B-5: Ops Never Sees the AI Layer

**Statement**: The goal of AI adoption is code that ops cannot distinguish from human-authored code. If ops must know about the AI to operate the system, the adoption has not succeeded.

**What this means in practice**:
- AI-generated PRs go through the same review process as human PRs — no "AI-authored" fast lane
- Monitoring, alerts, and runbooks do not reference AI or AI agents — they reference system behavior
- If an AI-generated handler causes an incident, the runbook for diagnosing it is the same as for a human-written handler
- The AI layer is invisible to production operations: it runs at development time, not in the production request path

**What triggers this law**:
- Ops team asks "is this a bug in the AI code or the human code?" (distinction should not matter — code is code)
- A runbook says "check if this was AI-generated" as a diagnostic step
- An AI-generated component requires special treatment in deployment, rollback, or monitoring
- The team creates a separate "AI code review" process with different standards than human code review

**Why it exists**:
By Week 24, the nopCommerce team's target state was: operations sees PRs with good tests, good documentation, and law-compliant code. They don't know whether Sonnet or a developer wrote it. This is not hiding the AI — it is the correct state of maturity. An AI that produces code requiring special ops handling is not yet mature enough for production use. The AI maturity arc ends when the AI layer disappears from operations consciousness.

**The test**: Show the last 5 AI-authored PRs to a senior ops engineer without telling them which were AI-authored. Can they tell? If yes, the AI is not yet mature enough. If no, LAW B-5 is satisfied.

---

## Summary Table

| Law | Core Statement | Violated When |
|---|---|---|
| B-1: Never greenfield | Discover before changing | AI rewrites patterns instead of adopting them |
| B-2: Standalone value per phase | Each phase is useful alone | Team skips a phase to get to the "good stuff" |
| B-3: Tests are truth | Don't delete tests for AI code | AI modifies tests to make its code pass |
| B-4: WHY not WHAT in skills | Context must explain the reason | Skill is a code template with no incident reference |
| B-5: Ops never sees the AI | AI is a dev-time tool, invisible in prod | Ops must know about AI to diagnose or operate system |

---

## The Meta-Law

All five laws share a root:

**Brownfield AI adoption is not about what the AI can generate. It is about what the system can safely absorb.**

The bottleneck is never the AI's ability to write code. The bottleneck is the team's ability to:
1. Know what the codebase actually does (Phase 0)
2. Encode that knowledge durably (Phases 1–2)
3. Feed that knowledge to the AI reliably (Phase 3)
4. Verify compliance continuously (Phase 4)

An AI given perfect context produces near-perfect brownfield code. An AI given no context rewrites the world. The 24-week program is entirely about building the context delivery system — not about the AI.
