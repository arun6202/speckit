# COMPASS
## A Brownfield-First Documentation Framework for AI-Assisted Development

> A gradual, code-anchored alternative to big-bang spec-driven development
> for organisations with legacy systems, mixed languages, and siloed teams.

---

## EXECUTIVE SUMMARY

SpecKit and similar frameworks are designed for greenfield projects with clean boundaries. Most enterprise codebases are not greenfield. Mandating SpecKit on a legacy estate produces compliance theatre: documents written, never maintained, increasingly misleading until quietly abandoned.

**COMPASS** is a brownfield-first alternative that:

- Keeps the code as the source of truth (because in brownfield, it always is)
- Adds the minimum useful documentation for AI anchoring
- Builds on established industry practice (ADRs, RFCs, C4, Strangler Fig)
- Adopts gradually, module by module, never as enterprise-wide mandate
- Costs less to maintain than it creates value

The name reflects the philosophy: **a compass gives you orientation in unmapped terrain. It does not redraw the territory.**

---

## WHY BROWNFIELD NEEDS A DIFFERENT FRAMEWORK

### The Honest Diagnosis

SpecKit's design assumptions:

```
Assumption                  Greenfield reality       Brownfield reality
────────────────────────────────────────────────────────────────────────
Clean boundaries exist      Yes — being designed     No — emerged over years
Codebase is understandable  Yes — fresh in minds     Partially — knowledge siloed
Ownership is clear          Yes — small team         No — many teams, churn
Specs precede code          Yes — natural order      No — code is the truth
Maintenance is possible     Yes — same team          Often no — handoffs frequent
```

Mandating greenfield-shaped processes on brownfield codebases is the most common failure mode of enterprise AI initiatives. It produces:

- Specs that describe what developers think the system does
- Divergence between specs and code within 60-90 days
- Compliance metrics ("85% spec coverage") that hide the divergence
- Misleading documentation that costs more than no documentation
- Quiet abandonment after 12-18 months without honest evaluation

COMPASS is designed to fail less often by demanding less.

---

## WHAT COMPASS KEEPS FROM SPECKIT

Three concepts are worth preserving:

### 1. The Constitution Concept
A single document that anchors AI behaviour to your actual standards. This works regardless of greenfield or brownfield. The execution differs.

### 2. AI as Pair, Not Replacement
AI generates code aligned with constraints you specify. Human judgment validates the output. SpecKit had this right.

### 3. Spec-Adjacent to Code
Documentation lives near the code it describes, not in a separate Confluence space that nobody reads.

What COMPASS rejects:

- Big-bang adoption mandates
- Spec-before-code as universal principle (greenfield-only insight)
- Full coverage as a goal (impossible and wasteful in brownfield)
- Single-tool lock-in (AI tooling will change rapidly)
- AI-generated specs of legacy code (produces confident fiction)

---

## THE COMPASS FRAMEWORK

Seven artefacts. Each one optional. Each one adopted independently as pain demands.

### C — Constitution
**Lightweight standards document. Lives at repository root.**

```markdown
# CONSTITUTION.md

## Language Conventions
- C# 11 features acceptable; no preview features
- Async methods suffixed with Async; no sync-over-async
- Domain types in /Domain — no infrastructure dependencies

## Error Handling
- No swallowed exceptions — every catch logs and re-throws or handles
- Public APIs return Result<T> patterns where appropriate
- DB transactions: explicit, scoped, with timeout

## AI Tool Guidance  
- Generated code reviewed line-by-line for security implications
- No external API calls added without explicit approval
- Database migrations require human authoring — never AI-generated

## What This Project Will Not Adopt
- We do not migrate to MediatR (project-wide decision, see ADR-007)
- We do not use AutoMapper (see ADR-012)
- Authentication: only via SsoProvider — no custom auth flows
```

**Maximum length: 200 lines.** If longer, you have rules nobody reads.

**Maintenance trigger:** When a recurring code review issue can be prevented by adding a rule.

---

### O — Origins (ADRs)
**Architecture Decision Records. Why we made the choices we did.**

Industry-standard pattern. Michael Nygard's format (ThoughtWorks, 2011):

```markdown
# ADR-014: Adopt Pact for Cross-Service Contract Testing

## Status
Accepted — 2026-03-15

## Context
Three teams own different layers of the order processing pipeline.
Integration bugs surface in production despite green CI on each service.
The contract between teams is implicit — documented in Confluence,
maintained nowhere, violated regularly.

## Decision
Adopt Pact consumer-driven contract testing between:
- OrderService (Java) ↔ PricingService (C#)
- PricingService (C#) ↔ NotificationService (Python)

Contracts owned by consuming team. Provider must satisfy
all consumer expectations or CI fails.

## Consequences
Positive:
- Integration bugs caught at PR time, not in production
- Cross-team contracts become explicit and versioned
- Breaking changes blocked before deployment

Negative:
- Initial setup: ~2 sprints per service pair
- Adds CI complexity — broker hosting required
- Cultural shift: providers must accommodate consumers

## Alternatives Considered
- OpenAPI contracts only: rejected — no runtime verification
- Shared library: rejected — couples deployment cadences
- Manual testing protocols: current state — failing
```

**One decision per file. Append-only. Never edited after acceptance — superseded by a new ADR if needed.**

**Storage:** `/docs/adr/` directory in the repository.

---

### M — Module READMEs
**One README per significant module. Near the code, not in Confluence.**

```markdown
# OrderProcessingService

## What This Does
Receives orders from upstream OrderIntake API, validates against
inventory and customer credit, persists to Oracle, publishes
OrderCreated event to Kafka.

## What Breaks This
- Oracle connection pool exhaustion (see runbook RB-007)
- Kafka topic config changes — coordinate with Platform team
- Credit service timeout — circuit breaker triggers fallback

## Who Knows This
- Primary:    Suresh K (architecture, business rules)
- Secondary:  Priya M (deployment, monitoring)
- Last full review: 2026-02-10

## Known Quirks
- Customer IDs starting with "LEG_" are pre-2018 legacy customers
  — different validation rules apply (see Validation.cs:142)
- Order amounts in TND require special tax handling
  — only Tunisia, ~50 orders/year, easy to forget

## When You Touch This, Update
- ConfigurationGuide.md if any environment variable changes
- This README if any "What Breaks This" entry changes
```

**Maintenance trigger:** Pain. Update when something breaks and the next person should know.

This is **living documentation** (Cyrille Martraire, 2019) — owned by whoever touches the code last.

---

### P — Pact / Contracts
**Cross-layer contracts. Machine-enforced.**

For systems with multiple services or layers, contracts replace cross-team specs entirely. The contract IS the spec:

```yaml
# pact/order-service-consumer-pricing.yaml
consumer:
  name: OrderService
provider:
  name: PricingService
interactions:
  - description: "Calculate price for standard order"
    request:
      method: POST
      path: /api/v2/calculate
      body:
        orderId: string
        items: array
    response:
      status: 200
      body:
        totalCents: integer (required, > 0)
        currency: string (required, ISO 4217)
        taxBreakdown: object (optional)
```

**The contract is enforced in CI on both consumer and provider builds.**

If a provider breaks the contract: their build fails.
If a consumer expects something the provider doesn't deliver: their build fails.

This replaces:
- Cross-team specification documents
- Manual integration testing protocols
- API documentation that drifts from reality
- Most causes of integration-time surprises

**Industry foundation:** Pact (2013-present), Spring Cloud Contract (2015), now standard in microservices architecture.

---

### A — AGENTS.md
**AI behavioural anchoring document.**

Distinct from Constitution.md. Constitution is for humans. AGENTS.md is for the AI tools your team uses (Copilot, Cursor, Claude Code, etc.).

```markdown
# AGENTS.md

## When generating code in this project:

### Always
- Follow patterns in /Domain for any new domain types
- Use Result<T> for operations that can fail meaningfully  
- Place tests in /Tests with [ModuleName].Tests namespace
- Reference existing similar code before generating new patterns

### Never
- Generate SQL migrations — humans only
- Add new NuGet packages without explicit instruction
- Modify files in /Legacy — they will be migrated, not modified
- Generate authentication or authorisation code

### When Uncertain
- Ask which existing module to model the new code after
- Verify whether this should be C# or moved to F# Domain layer
- Check if the requirement is covered by existing service

### Project Context
This is a brownfield C# system being incrementally migrated.
New domain logic should be F# in /Domain.FSharp where possible.
Legacy C# in /Legacy is being strangled, not enhanced.
```

**Industry pattern:** Cursor rules files, Claude Code memory files, GitHub Copilot custom instructions — all converging on this format.

**Vendor-agnostic by design.** The document is plain Markdown that any AI tool can read.

---

### S — Schemas (Typed Boundaries)
**Replace specs with types at every boundary.**

Where a SpecKit feature spec would describe inputs and outputs in prose, COMPASS uses typed schemas:

```csharp
// C# at the API boundary — using records and validation
public sealed record CreateOrderRequest(
    [Required] string CustomerId,
    [Required, MinLength(1)] IReadOnlyList<OrderLineItem> Items,
    [Required] string CurrencyCode,
    string? PromotionCode
);

public sealed record OrderLineItem(
    [Required] string ProductSku,
    [Range(1, 1000)] int Quantity,
    [Required] decimal UnitPriceCents
);
```

```python
# Python at the SP boundary — using Pydantic
class StoredProcedureResult(BaseModel):
    status_code: int
    affected_rows: int
    order_id: Optional[str]
    error_message: Optional[str]
    
    @field_validator('status_code')
    def status_must_be_known(cls, v):
        if v not in {0, 1, 2, 3, 99}:
            raise ValueError(f'Unknown SP status code: {v}')
        return v
```

**The boundary type IS the boundary specification.**

Validation happens at the boundary. The behaviour is enforced by the type system or runtime validator, not by a Markdown document.

---

### S — Strangler Markers
**Mark legacy code being migrated. Be explicit about it.**

```csharp
// File: Legacy/OrderProcessor.cs

// STRANGLER: This class is being migrated to Domain.FSharp.OrderPipeline
// Migration tracking: JIRA-3421
// Do not add new functionality here.
// Bug fixes acceptable until migration complete.
// Expected migration completion: Q3 2026
// Migration owner: Suresh K
```

This is the **Strangler Fig Pattern** (Martin Fowler, 2004) made visible in code.

Anyone touching legacy code immediately sees:
- This is being migrated
- Where it's migrating to
- Who owns the migration
- Whether they should add to it

AI tools reading the codebase see the same markers and avoid extending legacy modules.

**The marker is the specification of intent for that module.**

---

## GRADUAL ADOPTION ROADMAP

COMPASS is adopted module by module, never enterprise-wide as mandate.

### Phase 1: Foundation (Weeks 1-4)

**Effort:** 1 senior developer, part-time

Actions:
- Author `CONSTITUTION.md` for one repository (your own team's)
- Author `AGENTS.md` if AI tools are already in use
- Establish `/docs/adr/` directory with first 3-5 ADRs
  - ADRs for decisions already made (retrospective)
  - Document the why behind existing choices

Success criteria:
- AI-generated code in your team's repo follows team conventions
- Team can answer "why did we choose X over Y?" by linking to ADR
- New team members can read the constitution and understand standards

**Not yet attempted:**
- No spec writing for legacy modules
- No cross-team contracts yet
- No module READMEs for legacy code

---

### Phase 2: Pain-Driven Documentation (Months 2-3)

**Effort:** Distributed across team

Trigger: a production issue or onboarding pain reveals missing knowledge.

Response: 
- Write the Module README that would have prevented it
- Add to existing README if it exists
- Add an ADR if the missing knowledge was a decision

Do not:
- Write README for modules that have no pain
- Aim for coverage metrics
- Create documentation tasks in the sprint

Pain motivates maintenance. Mandate creates abandonment.

After 3 months, the README coverage will roughly correlate with the modules that matter most to your team.

---

### Phase 3: Boundary Hardening (Months 3-6)

**Effort:** Per-boundary, included in feature work

For every cross-team or cross-service boundary the team touches:
- Add typed schema at the boundary
- Pydantic for Python boundaries
- Records and validators for C# boundaries
- F# discriminated unions where applicable

Add Pact contracts:
- Start with one consumer-provider pair
- Choose the pair causing most integration friction
- Establish CI gates
- Repeat for next pair

This phase replaces the "specifications" of SpecKit with machine-enforced contracts.

---

### Phase 4: Strangler Marking (Months 6-12)

**Effort:** Included as standard part of refactoring work

For each legacy module being migrated:
- Add STRANGLER markers
- Link to migration tracking
- Identify migration owner
- Document expected completion

AI tools now have context to avoid extending legacy code.
New developers immediately see migration status.
Knowledge stops dying when people leave.

---

### Phase 5: Pattern Recognition (Year 2)

After 12 months, review:
- Which artefacts proved valuable in practice
- Which were written and never referenced
- What new patterns emerged organically

Drop the unused. Strengthen the valuable. **The framework adapts to the team, not vice versa.**

---

## INDUSTRY FOUNDATION

COMPASS is not novel. It is composition of established patterns:

| Component | Origin | Year |
|---|---|---|
| Architecture Decision Records (ADR) | Michael Nygard, ThoughtWorks | 2011 |
| Strangler Fig Pattern | Martin Fowler | 2004 |
| Living Documentation | Cyrille Martraire | 2019 |
| C4 Model | Simon Brown | 2018 |
| Consumer-Driven Contracts (Pact) | Ian Robinson, ThoughtWorks | 2007 |
| Parse-Don't-Validate (Schemas) | Alexis King | 2019 |
| Documentation as Code | Riona MacNamara, Google | 2014 |
| Constitution.md pattern | SpecKit (extracted) | 2024 |
| AGENTS.md pattern | Industry convergence | 2024-2025 |

**Each pattern is independently proven in production at scale.**

COMPASS contributes nothing new technically. Its contribution is composition: a brownfield-honest assembly of existing patterns into a coherent, gradually-adoptable framework.

---

## ANTI-PATTERNS COMPASS EXPLICITLY AVOIDS

### Coverage Metrics
"85% of modules have READMEs" is meaningless if 70% of those READMEs are stale.
COMPASS measures usage, not coverage:
- How many ADRs were referenced in code reviews last quarter?
- How often was the constitution updated when conventions changed?
- How many production issues were prevented by Module READMEs?

### AI-Generated Specifications of Legacy Code
AI reads legacy code and produces confident plausible fiction about what it means.
This fiction looks authoritative. It misleads more than no documentation.
COMPASS specifically prohibits AI-authored specs of code older than the AI.

### Big-Bang Mandates
Top-down "all teams must adopt COMPASS by Q3" produces compliance, not value.
COMPASS spreads by demonstration:
- Team A adopts it. Their AI tools work better. Onboarding is faster.
- Team B notices. They adopt voluntarily.
- The framework reaches the organisation by reputation, not mandate.

### Spec Maintenance Theatre
A spec that exists but isn't maintained is worse than no spec.
COMPASS requires every artefact to have a maintenance trigger:
- Constitution: updated when a recurring review issue can be prevented
- ADR: appended when a decision is made (never edited after acceptance)
- README: updated when something breaks
- AGENTS.md: updated when AI produces wrong patterns
- Strangler markers: updated when migration status changes

No trigger, no artefact.

---

## PRACTICAL EXAMPLES

### Example 1: Production Incident Reveals Missing Knowledge

```
3am: production incident in OrderService
Root cause: Currency conversion for TND orders fails on amounts > 999.999

Investigation finds:
- The behaviour is correct per the original 2019 design
- Documentation: none
- The original developer left in 2022
- Three people have touched the code, none flagged the limit
- The limit exists because Tunisia's banking system rejects > 999.999 TND

After incident:
- ADR-031 written: "Currency Precision Limits per ISO Banking Rules"
- OrderService README updated: "Known Quirks" section adds TND limit
- AGENTS.md updated: "When generating currency code, check Currency.cs:42 for limits"

Cost of documentation: 90 minutes
Benefit: this incident does not recur with new developers
```

### Example 2: AI Generating Code That Violates Standards

```
Junior developer asks Copilot to generate a repository class.
Copilot generates: 50 lines using Entity Framework patterns.
Team standard: Dapper, not EF. (Documented? No.)

Code review flags it. Time wasted: 30 minutes.

Action:
- AGENTS.md updated: "Data access: use Dapper, never Entity Framework"
- Constitution.md: link to AGENTS.md for AI behaviour

Next time Copilot is asked: it generates Dapper code.
Time saved per future occurrence: 30 minutes.
Cost: 5 minutes once.
```

### Example 3: Cross-Team Integration Friction

```
OrderService and PricingService had 14 integration bugs in Q1 2026.
Both teams' tests pass. Production breaks.

Action: ADR-019 adopts Pact between these services.
Setup: 2 sprints for first integration pair.
Q2 result: 2 integration bugs (down from 14).
Q3 result: 0 integration bugs.

Cost: 4 weeks of one developer's time
Benefit: 12 fewer production incidents per quarter, compounding
```

---

## SUCCESS METRICS THAT MATTER

COMPASS measures itself by outcomes, not artefacts:

```
Lagging indicators (look back quarterly):
- Production incidents traced to unclear decisions: ↓
- Onboarding time to first meaningful PR: ↓
- AI-generated code requiring rework: ↓
- Cross-team integration bugs: ↓

Leading indicators (look at monthly):
- ADRs added when significant decisions made: stable
- READMEs updated when modules change: > 60%
- Constitution referenced in code reviews: > 1/week
- AGENTS.md updates when AI patterns fail: > 1/month

Anti-metrics (avoid measuring these):
- Total documentation pages: irrelevant
- "Spec coverage": misleading in brownfield
- AI usage hours: gaming risk
- Lines of generated code: incentivises bloat
```

---

## HONEST EXPECTATIONS

COMPASS is not a transformation programme.

### What COMPASS will deliver
- AI tools producing more aligned code within 1 month
- Reduced onboarding pain within 3 months
- Fewer integration bugs after Pact adoption (6+ months)
- Living knowledge that survives team turnover (12+ months)

### What COMPASS will not deliver
- Comprehensive specifications of your legacy estate
- A single source of truth for all system behaviour
- Replacement for senior developer judgement
- Justification for replacing the team with AI

### What requires honesty from leadership

COMPASS works only if leadership accepts:
- Brownfield documentation is incremental, never complete
- The code remains the truth, regardless of documents written
- Pain motivates maintenance better than mandate
- Some legacy modules will never be documented — and that is acceptable
- Compliance metrics measure compliance, not understanding

If leadership demands enterprise-wide rollout with coverage metrics, COMPASS becomes SpecKit with a different name. Same theatre. Same eventual abandonment.

---

## COMPARISON: SPECKIT vs COMPASS

```
Aspect                  SpecKit                    COMPASS
──────────────────────────────────────────────────────────────────────────
Target codebase         Greenfield                 Brownfield
Source of truth         Specifications             Code (with anchoring docs)
Adoption model          Comprehensive              Gradual, per-team, per-module
Coverage goal           Full coverage              Pain-driven coverage
Spec authoring          Before code                Near code, after decisions
Maintenance trigger     Convention                 Concrete pain
Cross-team integration  Specifications             Pact contracts
Legacy code             Aspirational specs         Strangler markers
Failure mode            Documentation theatre      Documents nobody uses
Recovery from failure   Difficult — wide adoption  Easy — small footprint
Industry foundation     2024 framework             Patterns from 2004-2024
Vendor lock-in          SpecKit-specific tooling   Plain Markdown + standards
```

---

## CONCLUSION

The honest framework for brownfield AI-assisted development is composition of proven patterns adopted gradually as pain demands them.

COMPASS is that composition.

It is not a product. It is not a methodology. It is a pattern language describing what teams already do well when they document with discipline and adopt AI with caution.

Its name reflects its purpose: **orientation in complex terrain.**

Not a map redrawing the territory.
Not a compliance regime.
Not a vendor-locked tool.

Just enough documentation, in the right places, to keep teams oriented as the codebase evolves and the AI tools mature.

---

## APPENDIX A: ADOPTION CHECKLIST

```
[ ] Team-level Constitution.md authored (200 lines maximum)
[ ] /docs/adr/ directory established
[ ] 3-5 retrospective ADRs for existing major decisions
[ ] AGENTS.md authored for AI tools in use
[ ] First Module README written (for the most-touched module)
[ ] First boundary type / schema added (where most painful)
[ ] First STRANGLER marker on a module being migrated
[ ] First Pact contract between two services (after 3 months)
[ ] Review and prune at 12 months
```

## APPENDIX B: REFERENCES

- Nygard, Michael. "Documenting Architecture Decisions." 2011.
- Fowler, Martin. "StranglerFigApplication." 2004.
- Martraire, Cyrille. *Living Documentation*. Addison-Wesley, 2019.
- Brown, Simon. *The C4 Model for Visualising Software Architecture*. 2018.
- King, Alexis. "Parse, Don't Validate." 2019.
- ThoughtWorks Technology Radar (multiple editions).
- MacNamara, Riona. "Documentation as Code" — Google internal practice, externalised 2014.

---

*This framework is offered as an open proposal.*
*It contains no proprietary tooling, no vendor dependency, no licensing.*
*Take what is useful. Discard what is not. Adapt to your context.*
*The honest answer is always the one your team will actually maintain.*
