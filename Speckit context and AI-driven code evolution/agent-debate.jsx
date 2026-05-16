import { useState } from "react";

// ─── Agent Roster ────────────────────────────────────────────────────────────
const agents = {
  opus: {
    id: "opus", name: "OPUS-ARCH", model: "claude-opus-4-7",
    role: "Architect Planner", color: "#7C3AED", accent: "#A78BFA",
    icon: "◈", badge: "PLANNER",
    desc: "Holds invariants. Thinks in quarters. Makes architectural decisions.",
  },
  sonnet: {
    id: "sonnet", name: "SONNET-RUN", model: "claude-sonnet-4-6",
    role: "Execution Runner", color: "#0891B2", accent: "#67E8F9",
    icon: "⟡", badge: "RUNNER",
    desc: "Ships code. Thinks in sprints. Pragmatic under constraint.",
  },
  haiku: {
    id: "haiku", name: "HAIKU-OPS", model: "claude-haiku-4-5",
    role: "Ops Observer", color: "#059669", accent: "#6EE7B7",
    icon: "⬟", badge: "OPS",
    desc: "Guards stability. Monitors drift. Thinks in incidents.",
  },
  resolution: {
    id: "resolution", name: "RESOLUTION", model: "—",
    role: "Agreed Position", color: "#D97706", accent: "#FCD34D",
    icon: "✦", badge: "AGREED",
    desc: "All agents sign off.",
  },
};

// ─── Phase Debate Data ────────────────────────────────────────────────────────
const phases = [
  {
    id: 0, code: "P0", label: "Diagram Literacy", duration: "Weeks 1–2",
    color: "#7C3AED", accent: "#A78BFA", icon: "◈",
    tagline: "Make the invisible visible",
    turns: [
      {
        agent: "opus", type: "Opening",
        content: "The invariant for Phase 0: diagrams must be version-controlled, co-located with source, and renderable without human intervention. This eliminates Lucidchart, Confluence diagrams, and draw.io XML. Only Mermaid survives this filter — GitHub-native, Claude-fluent, npm-installable in CI, no Java. Sequence of adoption: C4 Context first. Eight years of internal knowledge exists; zero agreement on system boundary. Naming the external systems forces terminology consensus that resolves 30% of design-review friction.",
        highlight: "Mermaid only. C4 Context first. Co-located with source.",
      },
      {
        agent: "sonnet", type: "Challenge",
        content: "I agree on Mermaid. I disagree on sequencing. The team has operated nopCommerce for 8 years — they know the external boundary. What they do NOT know is why the plugin event cascade ordering causes 3–4 incidents per quarter. The IConsumer<T> handler execution order is alphabetical by plugin folder name — undocumented, fragile, load-bearing. Sequence diagrams for the 3 most incident-prone flows (checkout, refund, plugin-event-cascade) have immediate diagnostic value. C4 Context is a 20-minute Claude Code task from plugin descriptors, not a 2-hour workshop.",
        highlight: "Sequence diagrams first. C4 Context is auto-generatable.",
      },
      {
        agent: "haiku", type: "Concern",
        content: "Both positions assume we know what the system does. We don't. I have 4 documented incidents this year where production behavior diverged from team mental model. We must run a discovery sprint before committing any diagram as authoritative. Prompt Claude Code against /src: identify all external HTTP calls, non-standard DbContext access, plugins calling other plugins directly. Two benefits: ground-truth for C4 Context (OPUS-ARCH wants), and incident-pattern source for sequence diagrams (SONNET-RUN wants). Diagram from evidence, not assumption.",
        highlight: "Discovery run first. Never diagram from assumption.",
      },
      {
        agent: "opus", type: "Synthesis",
        content: "HAIKU-OPS is correct. Discovery sprint + diagram generation can be the same session. Day 1: Claude Code discovery → plugin-interaction-report.md → Claude generates C4 Context + 3 sequence diagrams from report. Day 2: team review (1hr) → DRAFT label removed from verified sections → commit alongside FRESHNESS.md. The DRAFT label is the safety mechanism: we never claim a diagram is authoritative until verified against actual runtime behavior. SONNET-RUN: error paths are mandatory in all sequence diagrams — happy paths are documentation debt.",
        highlight: "DRAFT label + FRESHNESS.md. Discovery-before-diagram is the new law.",
      },
      {
        agent: "resolution", type: "Resolution",
        content: "Claude Code discovery run → diagrams from evidence. Mermaid only. DRAFT label until senior engineer verifies against staging. FRESHNESS.md tracks 90-day re-verification cycles. Error paths mandatory in all sequence diagrams. Undocumented external integrations labeled [UNDOCUMENTED] in C4 Context. Discovery revealed: 2 undocumented integrations (Avalara tax, SSO provider), 1 direct-SQL plugin, 1 plugin event race condition — none in any mental model.",
        highlight: "5 artifacts committed. 0 wrong diagrams. 2 unknown integrations surfaced.",
      },
    ],
    artifacts: [
      {
        type: "mermaid", title: "C4 Context — nopCommerce",
        content: `C4Context
  title System Context — nopCommerce Platform
  Person(customer, "Customer", "Browses, orders, tracks")
  Person(admin, "Store Admin", "Manages catalog, orders, settings")
  Person(dev, "Plugin Developer", "Extends platform")
  System(nop, "nopCommerce", "ASP.NET Core 8. Plugin-based. ~200 plugins.")
  System_Ext(pay, "Payment Gateway", "Stripe/PayPal. PCI boundary.")
  System_Ext(email, "Email Service", "SendGrid. Transactional + marketing.")
  System_Ext(tax, "Tax Service", "Avalara. [UNDOCUMENTED — found in discovery]")
  System_Ext(sso, "SSO Provider", "Azure AD. [UNDOCUMENTED — found in discovery]")
  System_Ext(erp, "ERP / WMS", "Inventory + fulfillment sync.")
  System_Ext(claude, "Claude AI", "Code gen + docs via Claude Code + MCP.")
  Rel(customer, nop, "Shops", "HTTPS")
  Rel(admin, nop, "Administers", "HTTPS")
  Rel(nop, pay, "Processes payments", "HTTPS REST")
  Rel(nop, tax, "Calculates tax", "HTTPS REST")
  Rel(nop, sso, "Authenticates admins", "OIDC")
  Rel(claude, nop, "Reads, generates, validates", "Claude Code / MCP")`,
      },
      {
        type: "mermaid", title: "Checkout Sequence (with error paths)",
        content: `sequenceDiagram
  autonumber
  participant C as Customer
  participant Web as Storefront
  participant PS as IPaymentService
  participant GW as Payment Gateway
  participant OS as IOrderService
  participant EP as IEventPublisher
  participant DB as SQL Server

  C->>Web: POST /checkout/confirm
  Web->>PS: ProcessPayment(token, amount)
  PS->>GW: POST /v1/charges (idempotencyKey)
  alt Gateway timeout
    GW-->>PS: timeout after 5s
    PS-->>Web: PaymentResult{Error=GatewayTimeout}
    Web->>DB: INSERT Order{Status=PendingPayment}
    Web-->>C: /checkout/pending (retry in 5min)
  else Card declined
    GW-->>PS: {status=declined}
    Web-->>C: /checkout/payment (decline message)
  else Success
    GW-->>PS: {chargeId=ch_xxx}
    Web->>OS: PlaceOrderAsync(cart, payment)
    OS->>DB: INSERT Order + OrderItems
    OS->>EP: Publish OrderPlacedEvent
    par Plugin handlers (alpha order)
      EP->>DB: Enqueue confirmation email
    and
      EP->>DB: UPDATE StockQuantity (LAW-6: optimistic concurrency)
    and
      EP->>DB: INSERT ErpSyncQueue
    end
    Web-->>C: 302 → /checkout/completed/42
  end`,
      },
      {
        type: "adr", title: "ADR-000: Diagram Tooling",
        content: `Status: Accepted | Date: 2026-05-16
Decision: Mermaid exclusively for all architecture diagrams.

Rationale:
• Native GitHub/VS Code/JetBrains rendering — zero external tooling
• Claude generates Mermaid with highest accuracy across C4/sequence/ER
• CI validation: npx @mermaid-js/mermaid-cli — npm only, no Java
• PR text diffs are human-readable

Rejected: PlantUML (Java CI dependency), Structurizr (weak Claude support),
draw.io (binary diffs), Lucidchart (not version-controlled).

Consequences:
+ Every PR touching /docs/ validates diagram syntax
+ Diagrams render inline in GitHub PR reviews
− PlantUML C4 library is more expressive (acceptable tradeoff)
+ FRESHNESS.md tracks 90-day re-verification policy`,
      },
    ],
    decisions: [
      "Mermaid only — no Java in CI",
      "Discovery sprint precedes all diagramming",
      "DRAFT label until verified against production runtime",
      "FRESHNESS.md with 90-day re-verification cycles",
      "Error paths mandatory in all sequence diagrams",
    ],
    gems: [
      "The discovery run is the most valuable artifact — diagrams are just its rendering.",
      "Every brownfield codebase has secrets the team doesn't know it's keeping.",
      "A wrong diagram committed as authoritative compounds error across every downstream AI session.",
    ],
  },

  {
    id: 1, code: "P1", label: "Markdown-First Docs", duration: "Weeks 3–5",
    color: "#0891B2", accent: "#67E8F9", icon: "⟡",
    tagline: "Docs as code, not afterthought",
    turns: [
      {
        agent: "opus", type: "Opening",
        content: "ADRs are mandatory for any decision that changes a cross-plugin contract, modifies a migration strategy, adds or removes an external dependency, or establishes a pattern others will follow. Format: Michael Nygard lightweight — Context, Decision, Consequences — one page max. RFCs for decisions affecting >2 plugins or touching an external system boundary. Pandoc pipeline for enterprise format delivery: MD as single source of truth → PDF (management) → DOCX on-demand with corporate template → HTML for internal review. Week 3: ADR template + 10 retrospective ADRs from P0 discovery evidence.",
        highlight: "ADRs mandatory. Pandoc pipeline. MD as single source of truth.",
      },
      {
        agent: "sonnet", type: "Challenge",
        content: "Three reasons ADRs-first fails: (1) Retrospective ADRs from memory are fiction — 3 years later, only winners remember their reasoning. (2) The team won't write ADRs without an automated trigger — self-managed processes die in sprint 2. (3) Runbooks have immediate ops ROI. I can draft 15 runbooks this week from 18 months of incident logs and Slack history. An ADR from 2019 about Redis vs Memcached is worth nothing at 2am. A runbook that says 'run this SQL and restart the app pool' is worth everything. Runbooks first.",
        highlight: "Runbooks Week 3. ADRs Week 4 with automated triggers.",
      },
      {
        agent: "haiku", type: "Concern",
        content: "SONNET-RUN is correct on runbook priority — I have 23 frequently-executed manual procedures, none documented, 8 executed incorrectly at least once. On the ADR-from-PR-hook approach: it must be tuned to avoid noise. Hook fires only on structural changes: new ServiceRegistration.cs patterns, migration files, plugin.json additions, appsettings.json external endpoint additions. On Pandoc: DOCX must be on-demand only with explicit corporate reference template. Track-changes in auto-generated Word documents is a governance nightmare. Also: every runbook must include validation steps per step — 'completed when [observable outcome]'.",
        highlight: "Runbook validation steps mandatory. DOCX on-demand only.",
      },
      {
        agent: "opus", type: "Synthesis",
        content: "Accepted. Revised sequencing: Week 3 runbooks, Week 4 ADRs + Pandoc, Week 5 RFC template + Confluence read-only archive. On retrospective ADRs: extract from P0 discovery report, not from memory. Prompt: 'Read all plugin code. Identify DI patterns that differ from core, DB tables without Nop_ prefix, IConsumer handlers calling outside their plugin boundary. Flag which warrant ADRs.' This generates ADR candidates from evidence — developers add business context, Claude provides technical observation. This is how Phase 1 connects to Phase 0.",
        highlight: "Evidence-based ADRs from discovery data. Confluence → read-only archive.",
      },
      {
        agent: "resolution", type: "Resolution",
        content: "Week 3: 15 runbooks with validation steps (Claude-drafted from incident log). Week 4: ADR template + Claude Code PR hook (fires on structural changes only) + 5 evidence-based ADRs from P0 discovery. Week 5: Pandoc pipeline (HTML default, PDF on tag, DOCX on-demand) + RFC template + Confluence read-only. ADR-001 auto-generated: documents that IConsumer<T> handler execution order is alphabetical by plugin folder name — a production-critical undocumented constraint.",
        highlight: "15 runbooks. 5 ADRs from evidence. Pandoc pipeline live.",
      },
    ],
    artifacts: [
      {
        type: "code", title: "ADR Template",
        content: `# ADR-NNN: [Decision Title]

**Date**: YYYY-MM-DD | **Status**: Proposed | Accepted | Deprecated
**Context tags**: plugin | database | external-api | caching | events

## Context
[What situation forces this decision? 1-3 paragraphs.
New joiner must understand without jargon.]

## Decision
[Active sentence: "We will use X" not "X was chosen."]

## Consequences
**Positive:** [direct benefits]
**Negative:** [trade-offs accepted]
**Neutral:** [downstream changes]

## Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Option A | [reason] |`,
      },
      {
        type: "code", title: "Runbook Template",
        content: `# Runbook: [Procedure Name]

**System**: nopCommerce [module]
**Severity**: P1 / P2 / P3
**Last validated**: YYYY-MM-DD by @[engineer]
**Duration**: ~X minutes

## Symptoms
- [Observable symptom in monitoring or error log]

## Diagnosis
\`\`\`sql
SELECT [diagnostic query to confirm this runbook applies]
\`\`\`

## Procedure

### Step 1: [Name]
\`[exact command]\`
**Completed when**: [log message / SQL result / UI state]

### Step 2: [Name]
**Completed when**: [observable outcome]

## Validation
- [ ] [Check with expected value]
- [ ] Notify #ops-channel

## Rollback
If step [N] fails: [exact rollback procedure]`,
      },
      {
        type: "mermaid", title: "Pandoc Doc Pipeline",
        content: `graph LR
  MD[Markdown Source\n+ YAML frontmatter] --> Pandoc
  subgraph Pandoc Pipeline
    Pandoc -->|make docs| HTML[HTML\nfast local preview]
    Pandoc -->|make docs-pdf\nCI on git tag| PDF[PDF\nmanagement reports]
    Pandoc -->|make docs-docx\non-demand only| DOCX[DOCX\nclient deliveries]
  end
  Claude[Claude AI] -->|drafts + updates| MD
  PR[PR Review] -->|structural change\ntriggers hook| ADR[ADR Proposal\nas PR comment]
  ADR --> MD`,
      },
    ],
    decisions: [
      "Runbooks Week 3 — ops ROI first",
      "ADRs Week 4 with automated PR hook on structural changes",
      "Pandoc: HTML default, PDF on tag, DOCX on-demand",
      "Confluence: read-only archive after Week 3",
      "Evidence-based ADRs from P0 discovery, not from memory",
    ],
    gems: [
      "A runbook without validation steps is a script without error handling.",
      "The only ADR system that survives is one that runs automatically on code events.",
      "Retrospective ADRs written from memory are fiction — write them from code evidence.",
    ],
  },

  {
    id: 2, code: "P2", label: "Code → Skills", duration: "Weeks 6–10",
    color: "#059669", accent: "#6EE7B7", icon: "⬟",
    tagline: "Your codebase becomes a skill library",
    turns: [
      {
        agent: "opus", type: "Opening",
        content: "CLAUDE.md is the most critical artifact in the 24-week program. Every Phase 3 agent session references it. Structure: root CLAUDE.md with 10 invariants maximum (not 10 sections — 10 invariants), plugin-level CLAUDE.md per plugin, task-level context injected via @context commands. Mandatory root sections: project identity, 6 production laws (incident-sourced), forbidden patterns with incident history, production constraint patterns (the subtle ones that look wrong but are intentionally so), plugin development contract. For nopCommerce: LAW-1 cache scope, LAW-2 StoreId semantics, LAW-3 event handler threading, LAW-4 settings timing, LAW-5 repository boundary, LAW-6 stock concurrency.",
        highlight: "6 Production Laws sourced from incident history. Layered CLAUDE.md.",
      },
      {
        agent: "sonnet", type: "Challenge",
        content: "Context window is finite. Every token in CLAUDE.md is a token not in code generation. The correct filter: 'Would Claude know this from reading the code?' If yes — don't add it, Claude can read. Claude CANNOT infer: WHY IsCacheable=false on product search (2022 incident), WHY no await in IConsumer<T> handlers (thread pool starvation), WHY settings TTL is 60min not 5min (ERP sync timing), WHY StoreId=0 means global in settings but unassigned in orders. These production-constraint patterns — the things that look wrong but are intentionally so — are what belong in CLAUDE.md. Not the obvious patterns.",
        highlight: "CLAUDE.md filter: only what Claude cannot infer from reading the code.",
      },
      {
        agent: "haiku", type: "Concern",
        content: "From 18 months of incident logs — 6 pattern classes caused all 24 incidents: cache invalidation scope (7 incidents), plugin initialization order (4), event handler race (3), thread pool starvation (2), settings scope confusion (5), direct DbContext access (3). These 6 patterns — not nopCommerce's plugin development guide — are what belong in CLAUDE.md. Every AI session should know them as hard constraints. Any code suggestion that would trigger one should be flagged before the developer sees it. Skills should be built around these failure patterns, not around happy-path templates.",
        highlight: "Incident-pattern-first CLAUDE.md. 6 patterns, 24 incidents, 0 excuses.",
      },
      {
        agent: "sonnet", type: "Skill Granularity",
        content: "Skill granularity must be pattern-level, not function-level or feature-level. Too granular (function-level: 'create entity class') becomes obsolete as Claude improves. Too coarse (feature-level: 'implement new plugin') over-constrains. Right level: 'cache-aside-multi-store' — captures the non-obvious multi-store cache key pattern with StoreId isolation. Skill selection criterion: warranted when correct implementation requires knowledge NOT derivable from reading the code, OR requires combining patterns from 3+ source files, OR has a known incorrect 'obvious' implementation that causes incidents. For nopCommerce: 8–12 skills total.",
        highlight: "Pattern-level skills. 8–12 total. Incident-informed selection.",
      },
      {
        agent: "resolution", type: "Resolution",
        content: "Root CLAUDE.md: 6 production laws from incident data + plugin contract + project identity. Plugin-level CLAUDE.md: domain entity map + event contracts + known workarounds. Task-level: injected via @context. Skills: 8 pattern-level, all incident-informed. SpecKit scope for Phase 2: plugin API boundaries (config contract, events raised/consumed, DB ownership) — not internal implementation. Evidence: the most-referenced CLAUDE.md sections in future Phase 3 sessions are LAW-3 and LAW-4 — the non-obvious timing and threading constraints.",
        highlight: "6 laws. 8 skills. SpecKit at API boundary level only.",
      },
    ],
    artifacts: [
      {
        type: "code", title: "Root CLAUDE.md — Production Laws",
        content: `# nopCommerce — Claude Code Context

## The 6 Production Laws
(These 6 patterns caused the last 24 incidents.)

### LAW-1: Cache Invalidation Scope
RemoveByPrefix() is node-local in single-server, Redis-wide in multi-server.
Always assume multi-server. Use RemoveAsync(key) for targeted invalidation.

### LAW-2: Settings StoreId Semantics
Setting table: StoreId=0 = GLOBAL (all stores inherit)
Order/Customer table: StoreId=0 = UNASSIGNED (no store)
Same column name, different semantics. Query accordingly.

### LAW-3: Event Handler Threading
Never async/await inside IConsumer<T>.HandleEvent(). Event loop is synchronous.
Async handlers → thread pool starvation under load (observed >100 concurrent checkouts).
Use IQueuedEmailService or Hangfire for async work.

### LAW-4: Settings Read Timing
ISettingService.GetSettingByKey() returns null before IStoreContext.CurrentStore
is initialized. Plugin.Initialize() runs before store context. Never read settings
in Initialize(). Lazy-initialize or read on first request.

### LAW-5: Repository Boundary
Never access DbContext directly outside Nop.Data.
Bypassing IRepository<T> breaks cache invalidation chain. Read-only queries are NOT exempt.

### LAW-6: Stock Update Concurrency
OrderService and InventoryPlugin both write Product.StockQuantity.
Use optimistic concurrency (RowVersion) + retry on DbUpdateConcurrencyException.
Never pessimistic locking — deadlocks under load.`,
      },
      {
        type: "code", title: "Skill: cache-aside-multi-store",
        content: `// SKILL: cache-aside-multi-store
// WHY: LAW-1 — RemoveByPrefix scope differs by deployment topology
// SOURCE: 7 production incidents

// ✓ CORRECT
var cacheKey = _staticCacheManager.PrepareKeyForDefaultCache(
    NopCatalogDefaults.FeaturedProductsKey,
    storeId); // MUST include storeId for multi-store isolation

return await _staticCacheManager.GetAsync(cacheKey, async () =>
    await _productRepository.GetAllAsync(query =>
        query.Where(p => p.Published && !p.Deleted)
             .Where(p => !p.LimitedToStores ||
                         _storeMappingService.Authorize(p, storeId))));

// Invalidation: specific key, not prefix
await _staticCacheManager.RemoveAsync(cacheKey);

// ✗ NEVER: await _staticCacheManager.RemoveByPrefixAsync(prefix)
// Behavior changes without code change when topology changes.`,
      },
      {
        type: "code", title: "Skill: plugin-event-consumer",
        content: `// SKILL: plugin-event-consumer
// WHY: LAW-3 — async/await in event handlers → thread pool starvation
// SOURCE: 2 production incidents (thread pool exhaustion at peak load)

// ✓ CORRECT — synchronous handler
public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    public void HandleEvent(OrderPlacedEvent eventMessage)
    {
        try
        {
            var order = eventMessage.Order;
            // Enqueue async work — never await here
            _workflowMessageService
                .SendOrderPlacedCustomerNotificationAsync(order, order.CustomerLanguageId)
                .GetAwaiter().GetResult(); // Only OK: IWorkflowMessageService only enqueues

            // For CPU-bound async work: use Hangfire, not Task.Run
        }
        catch (Exception ex)
        {
            // IEventPublisher silently swallows exceptions. ALWAYS log.
            _logger.LogError(ex, "Error handling OrderPlacedEvent {OrderId}",
                eventMessage.Order.Id);
        }
    }
}
// ✗ NEVER: async Task HandleEvent(...) — IConsumer<T> is synchronous`,
      },
    ],
    decisions: [
      "Layered CLAUDE.md: root (6 laws) + per-plugin + task-level injection",
      "Skills are pattern-level, incident-informed, 8–12 total",
      "SpecKit scope: plugin API boundary only (not internal implementation)",
      "CLAUDE.md filter: only what Claude cannot infer from reading code",
      "Forbidden patterns list sourced from production incident data",
    ],
    gems: [
      "CLAUDE.md is the team's exocortex — context that makes every AI session senior-level.",
      "Skills encode the WHY, not the WHAT. WHAT is in the code. WHY is in 8 years of incidents.",
      "A skill is warranted when correct implementation requires out-of-band knowledge.",
      "The forbidden patterns list is your incident history compressed into constraints.",
    ],
  },

  {
    id: 3, code: "P3", label: "Workflow Automation", duration: "Weeks 11–16",
    color: "#D97706", accent: "#FCD34D", icon: "◉",
    tagline: "Skills compose into agents",
    turns: [
      {
        agent: "opus", type: "Opening",
        content: "The Planner/Runner boundary is a correctness boundary, not a speed boundary. Opus holds the WHAT: reads SpecKit spec, decomposes into atomic tasks, encodes architectural invariants into each task's acceptance criteria, defines task dependency graph. Sonnet holds the HOW: executes one atomic task, generates code satisfying acceptance criteria, runs tests, flags production law violations. Sonnet never makes architectural decisions. Opus never writes code. The reason: Sonnet optimized for execution speed produces technically correct code that violates system invariants. That failure mode is documented in our incident history.",
        highlight: "Opus: WHAT. Sonnet: HOW. Never cross the boundary.",
      },
      {
        agent: "sonnet", type: "Challenge",
        content: "Real workflows require micro-planning. Scenario: Opus plans 'implement category discount stacking' in 5 tasks. I execute Task 3. Midway, I discover IDiscountService.GetApplicableDiscountsAsync() requires a loaded Customer with store affiliation — Opus's spec assumed Customer was in cart context. Strict boundary: stop, escalate, wait 2 hours. Pragmatic model: make local adjustment, flag [ARCH-EXCEPTION: loaded Customer explicitly — cart context lacked store affiliation], continue. Opus reviews all ARCH-EXCEPTIONs in batch end-of-day. Speed without compromising integrity.",
        highlight: "[ARCH-EXCEPTION] flag + batch Opus review. Async escalation.",
      },
      {
        agent: "haiku", type: "Concern",
        content: "Both positions underestimate context loss between planning and execution. Opus plans Monday. Sonnet executes Thursday after 3 other tasks. Context that was obvious to Opus during planning is invisible to Sonnet during execution. The ARCH-EXCEPTION rate is driven by planning spec quality, not Sonnet capability. Fix: richer task specifications from Opus. Every task spec must include: scope (which files to touch / avoid), acceptance criteria (specific, observable, testable), relevant CLAUDE.md sections, applicable skills, and the architectural constraints most at risk in this specific task. 30 extra minutes per task spec saves 2 hours of ARCH-EXCEPTION management.",
        highlight: "Richer task specs reduce ARCH-EXCEPTION rate more than any runtime protocol.",
      },
      {
        agent: "opus", type: "MCP Design",
        content: "Two MCP servers for Phase 3, both read-only. MCP-1: PluginRegistry — list_plugins(), get_plugin_contract(systemName), get_plugin_events(systemName), check_plugin_dependency(pluginA, pluginB). MCP-2: SchemaInspector — get_table_schema(tableName), get_plugin_tables(systemName), get_foreign_keys(tableName), check_migration_history(). Explicitly NOT in Phase 3: any write operations. Read-only MCP servers are always safe. Write MCP servers require Phase 4 governance gates. Do not conflate them. Phase 3 earns the right to Phase 4 write capabilities by demonstrating governance discipline.",
        highlight: "Read-only MCP only. Write capabilities require Phase 4 governance.",
      },
      {
        agent: "resolution", type: "Resolution",
        content: "Opus: spec → rich task decomposition (scope + acceptance criteria + relevant context + constraints + anti-patterns). Sonnet: execute one task, flag [ARCH-EXCEPTION] for scope/invariant impacts. Opus reviews EXCEPTIONs in batch — async, not blocking. MCP: PluginRegistry + SchemaInspector, read-only. Loop termination: 5-point automated gate (tests pass, 80%+ coverage, SpecKit compliance, 0 LAW violations, 0 ARCH-EXCEPTIONs) OR human review gate if any exception. Every session → /transcripts/ structured MD. First feature cycle: category discount stacking, 5 tasks, 3 Sonnet sessions, 1 ARCH-EXCEPTION, 0 production incidents.",
        highlight: "First automated feature cycle complete. 0 production incidents.",
      },
    ],
    artifacts: [
      {
        type: "mermaid", title: "Multi-Agent Orchestration",
        content: `graph TD
  subgraph Planner["OPUS-ARCH (claude-opus-4-7)"]
    Spec[SpecKit Spec] --> Opus[Read spec + CLAUDE.md + ADRs]
    Opus --> Tasks[Rich task decomposition\nscope + criteria + constraints + skills]
    ArchEx[ARCH-EXCEPTION batch review] --> Opus
  end
  subgraph Runner["SONNET-RUN (claude-sonnet-4-6)"]
    Task[Single atomic task] --> LoadCtx[Load: task spec + skills + CLAUDE.md]
    LoadCtx --> MCP[Query MCP: PluginRegistry + SchemaInspector]
    MCP --> CodeGen[Generate implementation]
    CodeGen --> Tests[Run test suite]
    Tests --> Gate{Automated gate\n5 conditions}
    Gate -->|All pass| PR[PR ready]
    Gate -->|ARCH-EXCEPTION| Flag[Flag → Opus batch]
    Gate -->|Test fail x3| Escalate[Escalate to Opus]
  end
  subgraph Ops["HAIKU-OPS (claude-haiku-4-5)"]
    Log[Session transcript → /transcripts/]
    Monitor[Monitor: exception rate\ngate success rate\ntask abort rate]
  end
  Tasks --> Task
  PR --> Log
  Flag --> ArchEx
  CodeGen --> Log`,
      },
      {
        type: "code", title: "Opus Task Specification Template",
        content: `# Task Spec: [Feature] — Task N of M

**Depends on**: [task IDs] | **Unlocks**: [task IDs]

## What to implement
[Single outcome sentence — not the approach]

## Scope
Touch: src/Plugins/X/Services/XService.cs — add GetY()
Do NOT touch: src/Libraries/Nop.Services/ (requires ADR)
Never: migration files (human gate required)

## Acceptance Criteria
1. GetY(storeId) returns cached results, cache key includes storeId
2. Existing tests pass without modification
3. New test: GetY_ReturnsCachedResult_ForCorrectStore() passes
4. No direct DbContext access (LAW-5 — automated scan verifies)

## Relevant Context
Skills: cache-aside-multi-store, repository-query-cached
CLAUDE.md: LAW-1 (cache scope), LAW-2 (StoreId semantics)
Spec: /specs/plugins/nop-plugin-x.yaml

## Architectural Constraints (highest risk here)
• LAW-1: cache key MUST include storeId — this is per-store
• LAW-2: storeId=0 in query means global settings, not all stores

## Anti-Patterns to Watch
• RemoveByPrefix for invalidation (use targeted key)
• Loading full Product entity when only Id+Name needed`,
      },
      {
        type: "code", title: "Session Transcript Format",
        content: `# Agent Session Transcript

Session: 2026-07-25-P3-discount-task3
Agent: SONNET-RUN (claude-sonnet-4-6)
Opus task: Task 3/5 — Category discount eligibility check

## Context Loaded
Root CLAUDE.md: ✓ | Plugin CLAUDE.md: ✓
Skills: cache-aside-multi-store, plugin-event-consumer
MCP: PluginRegistry.get_plugin_contract() ✓

## Files Modified
DiscountEligibilityService.cs
→ Added: GetApplicableDiscountsAsync(item, storeId)
→ Fixed: StoreId scope in eligibility query

## [ARCH-EXCEPTION] AE-001
IDiscountService.GetApplicableDiscountsAsync() requires
loaded Customer with store affiliation. Task spec assumed
Customer in cart context.
Resolution: Loaded Customer via ICustomerService.
Impact: Within scope. +1 DB call. No perf SLA defined.
Opus review: Required.

## Gate Results
✓ All existing tests pass
✓ Coverage 87% (≥80%)
✓ SpecKit compliance
✓ CLAUDE.md laws: 0 violations
✗ ARCH-EXCEPTION raised → human review gate

Termination: Human review gate (ARCH-EXCEPTION AE-001)`,
      },
    ],
    decisions: [
      "Opus: task decomposition with rich specs including scope/criteria/constraints",
      "[ARCH-EXCEPTION] flag + async batch Opus review (not blocking)",
      "MCP: PluginRegistry + SchemaInspector — read-only Phase 3",
      "5-point automated gate OR human review for any exception",
      "Every session → structured transcript in /transcripts/",
    ],
    gems: [
      "Context propagation is the hardest problem in multi-agent workflows.",
      "An ARCH-EXCEPTION is the system working — it surfaced a planning gap before production.",
      "Read-only MCP is always safe. Write MCP requires governance gates.",
      "Every session transcript is organizational memory. Mine it for patterns.",
    ],
  },

  {
    id: 4, code: "P4", label: "Enterprise Integration", duration: "Weeks 17–24",
    color: "#BE185D", accent: "#F9A8D4", icon: "✦",
    tagline: "AI-native by default",
    turns: [
      {
        agent: "opus", type: "Opening",
        content: "Phase 4 is the inversion point. Phases 0–3 built AI capacity. Phase 4 inverts: the codebase teaches itself. All new work enters a governed pipeline producing spec-compliant, AI-assisted output by default. SpecKit governance: every new plugin needs plugin API spec, event contract spec, data ownership spec — before code merges. CI gate: hard fail on new public API without spec, warning on spec drift, info on new ARCH-EXCEPTION. Monthly Opus review: reads all session transcripts, updates CLAUDE.md, identifies spec gaps, proposes new skills from ARCH-EXCEPTION clusters. AI is ambient — not a project, an operating mode.",
        highlight: "SpecKit governs all new work. Monthly Opus review is the heartbeat.",
      },
      {
        agent: "sonnet", type: "Challenge",
        content: "The governance model creates a spec authorship bottleneck. Developers write code first (always). Spec is then retrospective (we said that's bad in Phase 1). Or they write minimal specs to satisfy CI gate without capturing real contracts. Fix: AI-drafted specs as the entry point. Workflow: PR created → spec-drafter agent (Haiku — fast, cheap) reads plugin code → generates draft SpecKit specs → posts as PR comment for review. Developer's job: review-and-approve a draft, not create-from-scratch. Same transition as ADRs in Phase 1. The AI does the heavy lifting; the human provides judgment.",
        highlight: "spec-drafter agent on PR creation. Developer reviews, not authors.",
      },
      {
        agent: "haiku", type: "CI Gate Calibration",
        content: "CI gate must be graduated. Hard fail on new public API without spec and breaking event payload change — yes. Warning on internal implementation drift — yes. Hard fail on all spec drift — no, generates false positives from legitimate refactors, destroys developer trust. Graduated response: hard fail (immediate), warning (5-day fix window), info (monthly review). Every hard fail must have a documented emergency bypass: P1-incident label, auto-notify arch+ops leads, merge with warning, mandatory spec update within 48 hours, automated revert PR if not done. No bypass path trains developers to avoid triggering CI.",
        highlight: "Graduated CI gate. Documented bypass procedure. Never a dead end.",
      },
      {
        agent: "opus", type: "Source Generator Strategy",
        content: "The F# Type Provider pattern for C#: Source Generators. PluginScaffoldGenerator reads /specs/plugins/{name}.yaml at compile time → generates: strongly-typed Settings class (ISettings), IRepository<T> interface signature, Event payload classes with validated shape. SpecKit compliance check moves from CI (post-push) to compile time (developer sees in VS Code before push). Scope for Phase 4: new plugin scaffolding only. Never touch existing code, never generate or modify migrations. Read spec → generate skeleton → developer fills business logic. Constrains correctly; never automates what must be human-reviewed.",
        highlight: "Source generators: compile-time SpecKit validation. New plugins only.",
      },
      {
        agent: "resolution", type: "Resolution",
        content: "Week 24 steady state: SpecKit coverage 94%, ARCH-EXCEPTION rate 0.8/cycle (from 6.2 at Phase 3 start), 5/5 team members reach for AI workflow first, 0 production incidents from AI-generated code. AI is ambient: no developer consciously thinks 'I need to use the AI workflow.' They write a spec (AI drafted it), review code (AI generated it), see CI pass (AI validated it). The AI layer is fully operational and fully invisible. Brownfield law 5 satisfied: ops never sees the AI layer.",
        highlight: "Week 24: AI ambient. 94% spec coverage. 0 AI-sourced incidents.",
      },
    ],
    artifacts: [
      {
        type: "mermaid", title: "Phase 4 Full Stack",
        content: `graph TD
  subgraph DevFlow["Developer Workflow"]
    PR[New feature PR] --> Drafter[spec-drafter agent\nHaiku — fast, cheap]
    Drafter --> Draft[Draft SpecKit specs\nas PR comment]
    Draft --> Review[Developer reviews\nand approves spec]
    Review --> Commit[Spec committed\nto /specs/]
  end
  subgraph CIGate["CI — SpecKit Compliance Gate"]
    Commit --> Check{New public API\nwithout spec?}
    Check -->|Hard fail| Block[PR blocked\nmake spec-draft to fix]
    Check -->|Warning| Warn[Spec drift warning\n5-day fix window]
    Check -->|Clean| Pass[PASS ✓]
  end
  subgraph Compile["Compile-Time Validation"]
    Commit --> SrcGen[Source Generator\nreads spec YAML]
    SrcGen --> Generated[Settings class\nRepository interface\nEvent payload class]
    Generated -->|Mismatch| IDEError[Compile error in IDE\nbefore push]
    Generated -->|Match| Pass
  end
  subgraph Monthly["Monthly Opus Review"]
    Transcripts[/transcripts/ corpus] --> Opus[Opus reads all\nsessions since last review]
    Opus --> Propose[Proposes:\nCLAUDE.md updates\nNew skills\nSpec backlog]
    Propose --> Sync[30-min team sync]
    Sync --> Update[Commit updates]
    Update --> Transcripts
  end
  Pass --> Merge[Merge to main]
  Merge --> Transcripts`,
      },
      {
        type: "code", title: "CI: SpecKit Compliance Gate",
        content: `# .github/workflows/speckit-compliance.yml

name: SpecKit Compliance Gate
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  speckit-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Detect new plugin APIs
        id: detect
        run: |
          NEW_PLUGINS=$(git diff --name-only origin/main...HEAD | grep "plugin.json$")
          echo "new_plugins=$NEW_PLUGINS" >> $GITHUB_OUTPUT

      - name: Hard fail — new plugin without spec
        if: steps.detect.outputs.new_plugins != ''
        run: |
          for plugin in ${{ steps.detect.outputs.new_plugins }}; do
            SYSTEM_NAME=$(cat $plugin | jq -r '.SystemName')
            SPEC="specs/plugins/${SYSTEM_NAME}.yaml"
            if [ ! -f "$SPEC" ]; then
              echo "::error::HARD FAIL: No SpecKit spec at $SPEC"
              echo "::error::Fix: make spec-draft PLUGIN=$SYSTEM_NAME"
              exit 1
            fi
          done

      - name: Spec drift check (graduated)
        run: |
          dotnet run --project tools/SpecKit.Validator \\
            --fail-on HARD_FAIL \\
            --warn-on DRIFT \\
            --output-format github-annotations`,
      },
      {
        type: "code", title: "Week 24 Steady-State Checklist",
        content: `## SpecKit Coverage
- [ ] 94%+ plugins have API spec
- [ ] All domain events have contract spec
- [ ] All plugin-owned table groups have data ownership spec

## CLAUDE.md Health
- [ ] Root CLAUDE.md: ≤10 production laws (no law without ADR)
- [ ] All plugin CLAUDE.md updated in last 90 days
- [ ] 0 production law violations in last 30 days

## Agent Workflow
- [ ] 100% new plugins via Opus task spec → Sonnet execution
- [ ] ARCH-EXCEPTION rate: <1 per feature cycle
- [ ] Automated gate pass rate: ≥85%

## Brownfield Laws Compliance
- [ ] Never greenfield-rewrote — all changes wrap and extend
- [ ] Each phase delivered standalone value
- [ ] Existing tests are truth source (coverage ≥ baseline)
- [ ] Skills encode tribal knowledge, not new patterns
- [ ] Ops never sees the AI layer ✓`,
      },
    ],
    decisions: [
      "spec-drafter agent (Haiku) generates draft specs on PR creation",
      "Graduated CI gate: hard fail / warning / info",
      "Source generators scoped to new plugin scaffolding only",
      "Monthly Opus review: first Monday, transcript analysis → CLAUDE.md + skill updates",
      "Emergency bypass procedure documented — no dead ends in CI",
    ],
    gems: [
      "When ops never sees the AI layer, the abstraction is complete.",
      "SpecKit specs are contracts that outlive the code that implements them.",
      "The monthly Opus review is the immune system of the AI adoption program.",
      "Phase 4 is the operating mode, not the destination. The loop is never done.",
      "The brownfield constraint became the adoption advantage — every skill is battle-tested.",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AgentDebate() {
  const [activePhase, setActivePhase] = useState(0);
  const [activeTurn, setActiveTurn] = useState(0);
  const [activeArtifact, setActiveArtifact] = useState(0);
  const [showGems, setShowGems] = useState(false);
  const [showDecisions, setShowDecisions] = useState(true);

  const phase = phases[activePhase];
  const turn = phase.turns[activeTurn];
  const artifact = phase.artifacts[activeArtifact];
  const agent = agents[turn.agent];

  const S = {
    root: {
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
      background: "#060609",
      color: "#E2E8F0",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      borderBottom: "1px solid #1E293B",
      padding: "14px 28px",
      background: "linear-gradient(135deg,#0F172A,#060609)",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexShrink: 0,
    },
    phaseBar: {
      display: "flex",
      borderBottom: "1px solid #1E293B",
      overflowX: "auto",
      flexShrink: 0,
    },
    main: {
      display: "grid",
      gridTemplateColumns: "1fr 340px 260px",
      flex: 1,
      overflow: "hidden",
    },
    debateCol: {
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #1E293B",
      overflow: "hidden",
    },
    turnNav: {
      display: "flex",
      gap: 0,
      borderBottom: "1px solid #1E293B",
      overflowX: "auto",
      flexShrink: 0,
    },
    turnContent: {
      flex: 1,
      overflowY: "auto",
      padding: "20px 24px",
    },
    artifactCol: {
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #1E293B",
      overflow: "hidden",
    },
    artifactTabs: {
      display: "flex",
      borderBottom: "1px solid #1E293B",
      flexShrink: 0,
    },
    artifactContent: {
      flex: 1,
      overflowY: "auto",
      padding: "16px",
    },
    sideCol: {
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      padding: "20px 16px",
      gap: 20,
    },
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Agent Debate Theater
        </div>
        <div style={{ flex: 1, height: 1, background: "#1E293B" }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {Object.values(agents).filter(a => a.id !== "resolution").map(a => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 10px",
              background: `${a.color}18`,
              border: `1px solid ${a.color}44`,
              borderRadius: 3,
            }}>
              <span style={{ color: a.color, fontSize: 12 }}>{a.icon}</span>
              <span style={{ fontSize: 9, color: a.accent, fontWeight: 700, letterSpacing: "0.15em" }}>{a.badge}</span>
              <span style={{ fontSize: 9, color: "#475569" }}>{a.model}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "#334155" }}>nopCommerce · 24 weeks · 5 engineers</div>
      </div>

      {/* Phase Timeline */}
      <div style={S.phaseBar}>
        {phases.map((p, i) => (
          <button key={p.id} onClick={() => { setActivePhase(i); setActiveTurn(0); setActiveArtifact(0); }}
            style={{
              flex: 1, minWidth: 110, padding: "12px 10px",
              background: activePhase === i ? `${p.color}18` : "transparent",
              border: "none",
              borderBottom: activePhase === i ? `2px solid ${p.color}` : "2px solid transparent",
              borderRight: "1px solid #1E293B",
              cursor: "pointer", textAlign: "left",
            }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 14, color: activePhase === i ? p.color : "#334155" }}>{p.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: activePhase === i ? p.accent : "#475569", letterSpacing: "0.15em" }}>{p.code}</span>
            </div>
            <div style={{ fontSize: 10, color: activePhase === i ? "#E2E8F0" : "#64748B", fontWeight: activePhase === i ? 600 : 400 }}>{p.label}</div>
            <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>{p.duration}</div>
          </button>
        ))}
      </div>

      {/* Main 3-Column Layout */}
      <div style={S.main}>

        {/* Left: Debate Thread */}
        <div style={S.debateCol}>
          {/* Turn Navigation */}
          <div style={S.turnNav}>
            {phase.turns.map((t, i) => {
              const a = agents[t.agent];
              return (
                <button key={i} onClick={() => setActiveTurn(i)}
                  style={{
                    padding: "8px 12px",
                    background: activeTurn === i ? `${a.color}22` : "transparent",
                    border: "none",
                    borderRight: "1px solid #1E293B",
                    borderBottom: activeTurn === i ? `2px solid ${a.color}` : "2px solid transparent",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    flexShrink: 0,
                  }}>
                  <span style={{ fontSize: 11, color: activeTurn === i ? a.color : "#334155" }}>{a.icon}</span>
                  <span style={{ fontSize: 9, color: activeTurn === i ? a.accent : "#475569", whiteSpace: "nowrap" }}>{t.type}</span>
                </button>
              );
            })}
          </div>

          {/* Active Turn Content */}
          <div style={S.turnContent}>
            {/* Agent header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${agent.color}22`,
                border: `2px solid ${agent.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: agent.color, flexShrink: 0,
                boxShadow: `0 0 16px ${agent.color}44`,
              }}>{agent.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{agent.name}</span>
                  <span style={{
                    fontSize: 8, padding: "2px 7px", borderRadius: 2,
                    background: `${agent.color}33`, color: agent.accent,
                    fontWeight: 700, letterSpacing: "0.15em",
                  }}>{agent.badge}</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748B" }}>{agent.role}</div>
                <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>{agent.model}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{
                  fontSize: 9, padding: "3px 10px",
                  background: "#0F172A", border: `1px solid ${phase.color}33`,
                  borderRadius: 3, color: phase.accent, letterSpacing: "0.1em",
                }}>{turn.type}</div>
              </div>
            </div>

            {/* Turn content */}
            <div style={{
              borderLeft: `3px solid ${agent.color}55`,
              paddingLeft: 16, marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: "#94A3B8", margin: 0 }}>
                {turn.content}
              </p>
            </div>

            {/* Highlight */}
            <div style={{
              padding: "10px 14px",
              background: `${agent.color}11`,
              border: `1px solid ${agent.color}33`,
              borderRadius: 6,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 8, color: agent.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
                {agent.icon} Key position
              </div>
              <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5 }}>{turn.highlight}</div>
            </div>

            {/* Turn navigation buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setActiveTurn(Math.max(0, activeTurn - 1))}
                disabled={activeTurn === 0}
                style={{
                  padding: "6px 14px", fontSize: 10, cursor: activeTurn === 0 ? "not-allowed" : "pointer",
                  background: "#0F172A", border: "1px solid #1E293B", borderRadius: 4,
                  color: activeTurn === 0 ? "#334155" : "#94A3B8",
                }}>← Prev</button>
              <button
                onClick={() => setActiveTurn(Math.min(phase.turns.length - 1, activeTurn + 1))}
                disabled={activeTurn === phase.turns.length - 1}
                style={{
                  padding: "6px 14px", fontSize: 10,
                  cursor: activeTurn === phase.turns.length - 1 ? "not-allowed" : "pointer",
                  background: `${phase.color}22`, border: `1px solid ${phase.color}44`,
                  borderRadius: 4, color: phase.accent,
                }}>Next →</button>
              <div style={{ marginLeft: "auto", fontSize: 9, color: "#334155", alignSelf: "center" }}>
                Turn {activeTurn + 1} / {phase.turns.length}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Artifact Viewer */}
        <div style={S.artifactCol}>
          {/* Artifact tabs */}
          <div style={S.artifactTabs}>
            {phase.artifacts.map((a, i) => (
              <button key={i} onClick={() => setActiveArtifact(i)}
                style={{
                  padding: "8px 10px", flex: 1,
                  background: activeArtifact === i ? `${phase.color}18` : "transparent",
                  border: "none",
                  borderBottom: activeArtifact === i ? `2px solid ${phase.color}` : "2px solid transparent",
                  borderRight: "1px solid #1E293B",
                  cursor: "pointer", fontSize: 9,
                  color: activeArtifact === i ? phase.accent : "#475569",
                  textAlign: "left", lineHeight: 1.4,
                }}>
                <div style={{ fontSize: 8, color: "#334155", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {a.type}
                </div>
                {a.title}
              </button>
            ))}
          </div>

          {/* Artifact content */}
          <div style={S.artifactContent}>
            <div style={{
              background: "#030306",
              border: `1px solid ${phase.color}33`,
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontSize: 9, color: phase.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                {artifact.type} · {artifact.title}
              </div>
              <pre style={{
                fontSize: 9, lineHeight: 1.7, margin: 0,
                color: "#64748B", whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontFamily: "inherit",
              }}>
                {artifact.content.split("\n").map((line, i) => {
                  const isKeyword = /^(graph|sequenceDiagram|C4Context|C4Container|subgraph|end|par|and|alt|else|loop|participant|Person|System|Container|Rel|autonumber)/.test(line.trim());
                  const isComment = line.trim().startsWith("//") || line.trim().startsWith("#");
                  const isArrow = line.includes("-->") || line.includes("->>") || line.includes("-->>");
                  return (
                    <div key={i} style={{
                      color: isKeyword ? phase.color : isComment ? "#334155" : isArrow ? "#475569" : "#64748B",
                    }}>{line}</div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Decisions + Gems */}
        <div style={S.sideCol}>
          {/* Phase maturity indicator */}
          <div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>AI Maturity Arc</div>
            {phases.map((p, i) => {
              const pct = [12, 30, 52, 75, 100][i];
              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 8, color: activePhase === i ? p.accent : "#334155" }}>{p.code}</span>
                    <span style={{ fontSize: 8, color: "#334155" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "#0F172A", borderRadius: 2 }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: `linear-gradient(90deg,${p.color},${p.accent})`,
                      borderRadius: 2, opacity: activePhase === i ? 1 : 0.25,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decisions */}
          <div>
            <button onClick={() => setShowDecisions(!showDecisions)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: showDecisions ? 10 : 0,
              }}>
              <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" }}>Decisions Made</span>
              <span style={{ fontSize: 9, color: "#334155" }}>{showDecisions ? "▾" : "▸"}</span>
            </button>
            {showDecisions && phase.decisions.map((d, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, marginBottom: 6,
                padding: "7px 10px",
                background: "#0A0A10",
                border: "1px solid #1E293B",
                borderRadius: 4, fontSize: 10, color: "#64748B", lineHeight: 1.4,
              }}>
                <span style={{ color: phase.color, flexShrink: 0, fontSize: 8, marginTop: 2 }}>▸</span>
                {d}
              </div>
            ))}
          </div>

          {/* Gems */}
          <div>
            <button onClick={() => setShowGems(!showGems)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: showGems ? 10 : 0,
              }}>
              <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" }}>Gems Extracted</span>
              <span style={{ fontSize: 9, color: "#334155" }}>{showGems ? "▾" : "▸"}</span>
            </button>
            {showGems && phase.gems.map((g, i) => (
              <div key={i} style={{
                marginBottom: 8, padding: "9px 12px",
                background: `${phase.color}0A`,
                border: `1px solid ${phase.color}33`,
                borderRadius: 5, fontSize: 10, color: "#94A3B8",
                fontStyle: "italic", lineHeight: 1.5,
              }}>
                <span style={{ color: phase.accent, marginRight: 6, fontStyle: "normal" }}>◈</span>
                {g}
              </div>
            ))}
          </div>

          {/* Brownfield Laws */}
          <div style={{
            padding: "12px", background: "#0A0A10",
            border: "1px solid #1E293B", borderRadius: 8,
          }}>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>Brownfield Laws</div>
            {[
              "Never greenfield-rewrite. Wrap and extend.",
              "Each phase delivers standalone value.",
              "Existing tests are the truth source.",
              "Skills encode tribal knowledge.",
              "Ops never sees the AI layer.",
            ].map((law, i) => (
              <div key={i} style={{
                fontSize: 9, color: "#475569", marginBottom: 5,
                paddingLeft: 10, borderLeft: "1px solid #1E293B", lineHeight: 1.5,
              }}>
                <span style={{ color: "#334155" }}>{i + 1}.</span> {law}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
