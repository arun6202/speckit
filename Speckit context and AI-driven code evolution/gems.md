---
title: "Gems — AI Adoption Principles"
source: "Multi-agent debate sessions P0–P4, nopCommerce brownfield context"
model: "claude-opus-4-7 (distillation)"
date: "2026-05-16"
purpose: "Timeless principles extracted from the 24-week debate corpus. These apply beyond nopCommerce."
---

# Gems: Principles from the Brownfield AI Adoption Debates

> Distilled by OPUS-ARCH from 47 agent session transcripts across 5 phases.  
> These are not best practices — they are hard-won truths from production systems.

---

## Diagram Gems (Phase 0)

### Gem 1: The Discovery Run Is the Artifact
> *The discovery run is the most valuable artifact. The diagrams are just its rendering.*

Every brownfield codebase has behavior nobody knows it's producing. The Claude Code discovery run surfaces ground truth before you diagram anything. In the nopCommerce case: 2 undocumented external integrations, 1 direct-SQL plugin, 1 race condition — none in anyone's mental model. Diagram from evidence, not from assumption.

**Implication**: Before diagramming any brownfield system, run a code-reading agent to catalog all external calls, non-standard patterns, and cross-module couplings. Spend 3 hours on discovery; spend 1 hour on diagrams.

---

### Gem 2: A Wrong Diagram Compounds
> *A diagram committed as authoritative without runtime verification is documentation debt with compounding interest — every AI session that reads it inherits the error.*

When Claude uses a wrong diagram as ground truth in Phase 2 skill generation, and those skills are used in Phase 3 agent execution, and that execution produces wrong code, you have a compounding error chain. The cost of verifying a diagram before committing is an hour. The cost of tracing a bug back to a wrong diagram is days.

**Implication**: DRAFT label + FRESHNESS.md is not bureaucracy — it is error rate management.

---

### Gem 3: Mermaid's Adoption Ceiling Is More Important Than Its Expressiveness Ceiling
> *PlantUML's expressiveness ceiling is higher than Mermaid's. Mermaid's adoption ceiling is higher than PlantUML's. Optimize for adoption.*

A theoretically expressive diagram standard that nobody renders in PRs, nobody writes in their editor, and that Claude generates inconsistently is worse than a less expressive standard that everyone uses effortlessly. Adoption is the variable that determines diagram value, not expressiveness.

---

## Documentation Gems (Phase 1)

### Gem 4: Retrospective ADRs From Memory Are Fiction
> *Write ADRs from code evidence, then add business context. Never from memory alone.*

Memory is selective and self-serving. The architect remembers choosing Redis over Memcached for the right reasons. The code may tell a different story — a `Thread.Sleep(500)` workaround that was never documented. Claude reading the code surfaces what was actually decided, not what was intended.

---

### Gem 5: A Runbook Without Validation Steps Is a Script Without Error Handling
> *It tells you what to do, not whether it worked.*

The most dangerous runbook is one that looks complete but has no observable outcome per step. An ops engineer at 2am executing step 3 of 7 with no way to confirm step 2 worked is flying blind. Every step must have: "Completed when: [observable outcome]."

---

### Gem 6: The Only ADR System That Survives Is One That Runs Automatically
> *Processes that require humans to remember them fail. Processes that run on code events survive.*

Hook ADR proposals to structural code events: new DI registrations, migration files, external endpoint additions. The developer's cognitive load is: review-and-approve, not remember-and-create. This is the difference between a process that dies in sprint 2 and one that runs for years.

---

## Skill Gems (Phase 2)

### Gem 7: CLAUDE.md Is the Team's Exocortex
> *Not documentation. Not a README. It's the accumulated context that makes an AI session as knowledgeable as your most senior engineer.*

The test for a CLAUDE.md entry: "Would Claude know this from reading the code?" If yes, don't add it — Claude can read. If no — if it requires knowledge of a 2022 production incident, a timing constraint from a vendor, a business rule that was argued over in a 3-hour meeting — that belongs in CLAUDE.md.

---

### Gem 8: Skills Encode the WHY, Not the WHAT
> *WHAT is already in the code. WHY is in 8 years of production incidents.*

A skill that shows how to implement a cache-aside pattern is marginally useful — Claude can generate that from reading any caching library. A skill that shows how to implement cache-aside in nopCommerce's multi-store context, with the correct StoreId isolation semantics, is invaluable — Claude cannot infer the correctness criterion from any single code file.

---

### Gem 9: A Skill Is Warranted When Correct Implementation Requires Out-of-Band Knowledge
> *If Claude could figure it out from the source, don't write a skill — write better code.*

The skill selection filter: does the correct implementation require knowledge not in the codebase? (A 2019 incident where the naive implementation caused thread pool starvation; a vendor's undocumented API timing behavior; a business rule that's nowhere in code.) If yes → skill. If the code itself explains it → improve the code or its comments.

---

### Gem 10: The Forbidden Patterns List Is Your Incident History Compressed Into Constraints
> *Write it from production data, not from coding standards.*

A forbidden pattern sourced from a coding style guide is advisory. A forbidden pattern sourced from "this exact pattern caused a production incident on [date] that took 4 hours to resolve" is a law. The incident history is not a liability — it's the source material for the most effective AI guardrails the team will ever write.

---

## Multi-Agent Gems (Phase 3)

### Gem 11: Context Propagation Is the Hardest Problem in Multi-Agent Workflows
> *The answer is not smarter agents — it is richer task specifications.*

An agent that receives "implement category discount stacking" will make assumptions. An agent that receives the same task plus: relevant CLAUDE.md sections, applicable skills, explicit scope boundaries, observable acceptance criteria, and the architectural constraints most at risk — that agent produces deterministic output. The planning investment pays for itself in execution speed.

---

### Gem 12: An ARCH-EXCEPTION Is the System Working, Not Failing
> *The agent surfaced a planning gap before it became a production incident.*

When a Sonnet execution session flags `[ARCH-EXCEPTION]`, the correct response is: "The system caught a planning gap at the right moment." Not: "The agent failed." The exception mechanism exists precisely to surface moments when the task spec didn't account for a runtime constraint. The rate of ARCH-EXCEPTIONs is a measure of planning quality, not execution quality.

---

### Gem 13: Read-Only MCP Servers Are Always Safe; Write MCP Servers Require Governance Gates
> *Do not conflate them. Do not rush write capabilities into agents that haven't earned the trust.*

A Sonnet agent that can read plugin metadata cannot break production. A Sonnet agent that can modify plugin settings or database records can. The governance gate (SpecKit compliance, human review for migrations, hard CI fail on unspecced changes) must be in place before write MCP capabilities are extended to agents.

---

### Gem 14: Every Session Transcript Is Organizational Memory
> *Mine the corpus. The patterns in it tell you what to fix next.*

After 47 session transcripts, the ARCH-EXCEPTION cluster analysis revealed: 40% of exceptions came from Opus task specs that didn't include the relevant CLAUDE.md section references. The fix was structural (add "Relevant Context" section to task spec template), not training. The transcript corpus told us exactly what to fix.

---

## Enterprise Gems (Phase 4)

### Gem 15: The Spec Is the Contract; Code Is One Implementation
> *SpecKit specs outlive the code that implements them. A new developer should be able to re-implement from the spec alone.*

If the spec requires the implementation to exist for it to make sense, the spec is describing implementation. A spec that can survive a complete rewrite of its implementing code is a contract. Contracts are worth maintaining. Implementation descriptions become stale immediately.

---

### Gem 16: When Ops Never Sees the AI Layer, You Have Succeeded
> *When ops can't tell whether code was AI-generated or human-written, the abstraction is complete.*

If an on-call engineer responding to a 3am alert has to think "is this AI-generated code?" the AI layer is visible — and visibility means the abstraction leaked. The goal is AI as infrastructure, not AI as feature. Infrastructure is invisible until it fails, at which point it has runbooks, not exceptions.

---

### Gem 17: Phase 4 Is Not a Destination — It Is the Operating Mode
> *There is no "done." There is only: the loop is running, the rate of improvement is measurable, and the team is shipping faster with fewer incidents.*

Teams that treat Phase 4 as a project completion point will see the system calcify. The monthly Opus review, the ARCH-EXCEPTION tracking, the FRESHNESS.md cycles — these are not project activities. They are the metabolism of an AI-native team. Stop the metabolism and the system atrophies.

---

### Gem 18: The Brownfield Constraint Becomes the Adoption Advantage
> *"Never greenfield-rewrite" felt like a limitation. It became a trust accelerator.*

Every skill is battle-tested because it was extracted from production code. Every SpecKit spec is grounded in a real plugin's actual behavior. Every CLAUDE.md law is sourced from an actual incident. The constraint of working within the existing system — rather than replacing it — means the AI adoption has a richer, more reliable knowledge base than any greenfield alternative would have.

---

## The 5 Brownfield Laws (from the Adoption Arc)

These five laws appeared in the existing ai-adoption-roadmap.jsx. The debates across P0–P4 validated and refined them:

1. **Never greenfield-rewrite. Wrap and extend.** — Validated. The discovery run revealed the existing codebase contains constraints invisible in any spec. Rewrites lose those constraints and rediscover them as incidents.

2. **Each phase must deliver standalone value.** — Validated. P0 delivered ground-truth diagrams independently. P1 delivered runbooks independently. No phase required the next to be useful.

3. **Existing tests are the truth source.** — Validated. The automated gate's first check is existing test passage. Not SpecKit compliance. Not ARCH-EXCEPTION count. Test passage first.

4. **Skills encode tribal knowledge, not new patterns.** — Validated. Every skill that survived to Phase 4 was sourced from incident data. Skills sourced from "best practices" were removed in the Month 5 Opus review as never-referenced.

5. **Ops never sees the AI layer.** — Validated at Week 24. Zero production alerts linked to AI-generated code. Zero on-call engineers asked "is this AI code?" The layer is invisible.

---

## The Opus Distillation (Model Note)

These gems were distilled using `claude-opus-4-7` — the architectural planner model — because gem extraction requires synthesis across a large transcript corpus, identification of non-obvious patterns, and the ability to separate what merely happened from what is *worth knowing*. Sonnet executes. Haiku monitors. Opus understands.

The gems are not summaries of what happened. They are the principles that would have saved time if the team had known them on Day 1.
