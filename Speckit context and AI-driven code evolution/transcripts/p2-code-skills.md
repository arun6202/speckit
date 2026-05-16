---
phase: P2
title: "Code → Skills"
weeks: "6–10"
session_id: "debate-p2-nopcommerce-20260516"
agents:
  - id: OPUS-ARCH
    model: claude-opus-4-7
    role: Architect Planner
  - id: SONNET-RUN
    model: claude-sonnet-4-6
    role: Execution Runner
  - id: HAIKU-OPS
    model: claude-haiku-4-5
    role: Ops Observer
moderator: "Claude Code Operator"
verdict:
  - "Layered CLAUDE.md: root (10 invariants max) + per-plugin (domain context) + per-task (injected)"
  - "Production-constraint patterns section is mandatory in root CLAUDE.md"
  - "Skill granularity: pattern-level, not function-level — one skill per reusable architectural pattern"
  - "SpecKit specs start at plugin-API boundary level, not internal implementation level"
  - "Skills encode the WHY, not the WHAT — WHAT is already in the code"
---

# Phase 2: Code → Skills — Agent Debate Transcript

**Session**: 2026-06-06T09:00:00Z  
**Inputs from P0/P1**: 5 architecture diagrams, 15 runbooks, 5 ADRs, Pandoc pipeline  
**Goal**: Transform 8 years of tribal knowledge into Claude Code skills and CLAUDE.md context files

---

## Pre-Session Brief

Phase 2 is the highest-leverage phase in the 24-week program. If done correctly, every future Claude Code session on this codebase will have senior-engineer-level context automatically. If done incorrectly — CLAUDE.md too long, skills too narrow, patterns too aspirational — the AI context becomes noise and developers will bypass it.

The central tension: **completeness vs. relevance**. A complete CLAUDE.md is unusable. A minimal CLAUDE.md misses critical constraints. The skill of writing CLAUDE.md is knowing which 10% of tribal knowledge is load-bearing.

---

## Turn 1 — OPUS-ARCH [Opening Position]

CLAUDE.md is the most critical artifact in the entire 24-week program. Every Phase 3 agent session and Phase 4 SpecKit governance run will reference it. Getting it wrong propagates errors across all downstream phases.

**My invariants for CLAUDE.md structure:**

1. **Root CLAUDE.md** at repository root — 10 invariants maximum. Not 10 sections. 10 invariants. If you can't distill 8 years into 10 non-negotiable rules, you haven't done the distillation work.

2. **Plugin-level CLAUDE.md** in each plugin directory — plugin-specific patterns, domain entity map, plugin event contracts, known workarounds. Length: unconstrained, but Claude reads less than 2000 tokens of context effectively per call.

3. **Task-level context injection** via Claude Code commands — `@context catalog-search` injects the search plugin's context, not the payment plugin's context. This prevents context contamination across plugin boundaries.

**Mandatory root sections:**
- Project identity and non-negotiables (1 paragraph)
- Architectural invariants (10 max — these are the laws, not suggestions)
- Forbidden patterns with reasons (not what to avoid — WHY it causes production incidents)
- Production constraint patterns (the subtle ones that look wrong but are intentionally so)
- Plugin development contract (what every plugin MUST implement)

For nopCommerce, the forbidden patterns alone will save the team from 6-7 class of recurring bugs I see in their incident history.

---

## Turn 2 — SONNET-RUN [Pragmatic Challenge]

Ten invariants in a root CLAUDE.md sounds manageable until you're on call at 2am debugging a plugin and Claude is loading 3 CLAUDE.md files, a task-level context, and the P0 architecture diagrams simultaneously. Context window is finite. Every token in CLAUDE.md is a token not available for code generation.

The real question isn't "what should CLAUDE.md contain" — it's "what should CLAUDE.md contain that Claude wouldn't infer from reading the code?" That is the correct filter.

Claude can infer from code:
- That we use Entity Framework — it sees the DbContext
- That we have a cache layer — it sees IStaticCacheManager usages
- That plugins implement IPlugin — it's in the class declaration

Claude CANNOT infer from code:
- WHY `IsCacheable = false` is set on product search (performance tuning decision from 2022 incident)
- WHY we don't await inside `IConsumer<T>.HandleEvent` (thread pool starvation incident)
- WHY the settings cache TTL is 60 minutes not 5 minutes (ERP sync timing dependency)
- WHY `StoreId = 0` means global in settings but means "not in any store" in orders

These are the production-constraint patterns that HAIKU-OPS identified in Phase 0. These are what belong in CLAUDE.md — not the obvious patterns Claude can read from the code.

My filter: **If a senior developer would not put it in a code comment because "it's obvious", it doesn't belong in CLAUDE.md either. CLAUDE.md is for what looks wrong but is intentionally so.**

---

## Turn 3 — HAIKU-OPS [Production-First Perspective]

SONNET-RUN has articulated exactly the right filter. Let me make it operational.

I have 18 months of incident logs. I ran a retrospective on the root causes:

| Incident Class | Count | Root Cause Pattern |
|---|---|---|
| Cache invalidation error | 7 | Developer assumed cache cleared on save; it doesn't in multi-store |
| Plugin initialization order | 4 | Settings read before store context initialized |
| Event handler race condition | 3 | Two handlers both writing same DB row on OrderPlaced |
| Thread pool starvation | 2 | async void in IConsumer<T>.HandleEvent |
| Settings scope confusion | 5 | StoreId=0 treated as "all stores" in setting; treated as "no store" in order |
| Direct DbContext access | 3 | Bypassed repository → missed cache invalidation |

**These 6 patterns — not nopCommerce's plugin development guide — are what belong in CLAUDE.md.** Every future Claude Code session should know these 6 patterns as if they were hard-coded constraints. Any code suggestion that would trigger one of these patterns should be flagged before the developer sees it.

Additionally: skills should be built around these failure patterns, not around happy-path templates. A skill that shows how to implement a cache-aside pattern is useful. A skill that shows how to implement it correctly in the context of nopCommerce's multi-store cache isolation is invaluable.

---

## Turn 4 — OPUS-ARCH [Integration: Structural Decision]

Accepted. HAIKU-OPS's incident classification is the CLAUDE.md seed data. Let me integrate both positions:

**Root CLAUDE.md structure (incident-pattern-first):**

```markdown
# nopCommerce — CLAUDE.md

## Project Identity
nopCommerce 4.70 on ASP.NET Core 8. Plugin architecture. 5-person team.
8 years production. Multi-store. SQL Server 2019 + Redis 6.

## The 6 Production Laws
(Violations of these caused the last 24 incidents. Never violate them.)

1. CACHE INVALIDATION SCOPE — `IStaticCacheManager.RemoveByPrefix` is node-local
   in single-server, Redis-wide in multi-server. Always assume multi-server.
   
2. SETTINGS SCOPE — StoreId=0 in Setting table means GLOBAL (all stores inherit).
   StoreId=0 in Order/Customer context means UNASSIGNED. These are different concepts.
   
3. EVENT HANDLER THREADING — Never use async/await in IConsumer<T>.HandleEvent.
   Event publishing is synchronous. Async handlers cause thread pool starvation
   under load. Use Fire-and-forget with proper error isolation if async is needed.
   
4. SETTINGS READ TIMING — ISettingService.GetSettingByKey returns null if called
   before IStoreContext.CurrentStore is initialized. Plugin Initialize() is called
   before store context. Read settings in the first request, not in Initialize().
   
5. REPOSITORY PATTERN — Never access DbContext directly outside Nop.Data.
   Bypassing IRepository<T> breaks cache invalidation chain. Even for "read-only"
   queries — use IRepository<T>.Query() or domain service methods.
   
6. STOCK UPDATE RACE — IConsumer<OrderPlacedEvent> and IOrderService.PlaceOrder
   both write Product.StockQuantity. InventoryPlugin must use optimistic concurrency
   (RowVersion check) and retry on conflict, not pessimistic locking.
```

This is the root CLAUDE.md core. Six laws, each with the incident reason embedded.

---

## Turn 5 — SONNET-RUN [Skill Granularity Debate]

Now we need to resolve skill granularity. I've seen two failure modes:

**Too granular** (function-level skills): `skill: create-nop-entity-class` — generates a single entity class with EF mapping. Useful once, then Claude gets better at it than the skill anyway. Skills at this level become obsolete in 3 months as Claude improves.

**Too coarse** (feature-level skills): `skill: implement-new-plugin` — generates an entire plugin scaffold. Too prescriptive. Every plugin is different. Over-constrains creativity.

**Right level** (pattern-level skills): `skill: cache-aside-multi-store` — implements the correct multi-store cache-aside pattern using IStaticCacheManager, with the right StoreId isolation, correct TTL, and invalidation strategy. This captures a non-obvious pattern that Claude cannot infer from reading the codebase because the correctness criterion (multi-store isolation) is not visible in any single code location.

**Skill selection criterion**: A skill is warranted when the correct implementation requires knowledge that:
- Is NOT derivable from reading the code (production constraint, historical decision)
- OR requires combining patterns from 3+ different source files
- OR has a known incorrect "obvious" implementation that causes incidents

For nopCommerce, this gives approximately 8–12 skills:

1. `cache-aside-multi-store` — correct IStaticCacheManager pattern
2. `plugin-event-consumer` — correct IConsumer<T> with threading safety
3. `plugin-settings-initialize` — safe settings read timing
4. `entity-plugin-migration` — database migration pattern with rollback safety
5. `repository-query-cached` — IRepository<T> with cache layer
6. `plugin-service-registration` — DI registration with correct scope
7. `multi-store-entity-query` — entity filtering with StoreId scope
8. `background-task-idempotent` — IScheduleTask with idempotency guard

---

## Turn 6 — HAIKU-OPS [Risk Sign-off + SpecKit Scope]

Accepted on skill granularity. One addition on SpecKit: **start SpecKit specs at the plugin-API boundary, not internal implementation**.

SpecKit specs that describe internal implementation details become technical debt the moment the implementation changes. SpecKit specs that describe plugin API contracts (what the plugin exposes, what it consumes, what events it raises/handles) remain valid across implementation refactors.

For nopCommerce Phase 2, SpecKit scope:
- What the plugin's `Configure()` admin page accepts and validates
- What events the plugin publishes and the payload shape
- What events the plugin consumes and the expected handler behavior
- What DB tables the plugin owns vs. reads from (ownership boundary)

Not in scope for Phase 2 SpecKit: internal method signatures, service class structure, repository implementation.

---

## Resolution

**CLAUDE.md structure:**
- Root: 6 production laws (incident-sourced) + project identity + plugin contract (10 items max)
- Per-plugin: domain entity map + event contracts + known workarounds + plugin-specific ADRs
- Task-level: injected via `@context <plugin-name>` Claude Code command

**Skill selection**: Pattern-level, incident-informed, 8–12 skills total for Phase 2

**SpecKit scope**: Plugin API boundaries (contracts, events, ownership) — not internal implementation

---

## Artifacts Produced

### Artifact 1 — Root CLAUDE.md

```markdown
# nopCommerce Platform — Claude Code Context

**Version**: nopCommerce 4.70 | **Framework**: ASP.NET Core 8 | **DB**: SQL Server 2019 + Redis 6  
**Team**: 5 engineers | **Production since**: 2018 | **Plugins**: ~200 loaded

---

## The 6 Production Laws

These 6 patterns caused the last 24 production incidents. Treat them as hard constraints.
Any code suggestion that violates these must include an explicit justification.

### LAW-1: Cache Invalidation Scope
`IStaticCacheManager.RemoveByPrefix(prefix)` removes from:
- In-memory only: single-server setups
- Redis cluster-wide: multi-server setups
Always assume multi-server. Use `IStaticCacheManager.RemoveAsync(key)` for targeted invalidation.
Never assume a prefix clear is safe without checking the current deployment topology.

### LAW-2: Settings Scope Semantics (StoreId=0 means DIFFERENT things in different contexts)
- In `Setting` table: `StoreId=0` = GLOBAL (all stores inherit this value unless overridden)
- In `Order`, `Customer`, `Address` tables: `StoreId=0` = UNASSIGNED / not associated with any store
These are different concepts with the same column name. Query accordingly.

### LAW-3: Event Handler Threading
Never use `async/await` inside `IConsumer<T>.HandleEvent()`. The event publishing loop is
synchronous. Async handlers cause thread pool starvation under load (observed at >100 concurrent checkouts).
If async work is needed: enqueue to IQueuedEmailService, Hangfire, or a dedicated background task.

### LAW-4: Settings Read Timing
`ISettingService.GetSettingByKey()` returns `null` when called before `IStoreContext.CurrentStore`
is initialized. Plugin `Initialize()` is called before store context exists.
**Do not read settings in `Initialize()`.** Read them in the first request handler or lazy-initialize.

### LAW-5: Repository Pattern Boundary
Never access `IDbContext` or `NopObjectContext` directly outside of `Nop.Data`.
Bypassing `IRepository<T>` breaks the cache invalidation chain — the repository signals
the cache manager on writes. Read-only queries are not exempt: use `IRepository<T>.Table`
or domain service methods that are cache-aware.

### LAW-6: Stock Update Concurrency
`IOrderService.PlaceOrder()` and `IConsumer<OrderPlacedEvent>` handlers (particularly
InventoryPlugin) both write to `Product.StockQuantity`. Use optimistic concurrency
(`rowVersion` / `timestamp` column check) and retry on `DbUpdateConcurrencyException`.
Never use pessimistic locking (table hints) — causes deadlocks under load.

---

## Project Architecture (Reference P0 diagrams)

- Full system: `/docs/architecture/context.md`
- Internal containers: `/docs/architecture/container.md`  
- Checkout flow: `/docs/architecture/checkout-flow.md`
- Plugin event cascade: `/docs/architecture/plugin-events.md`

---

## Plugin Development Contract

Every plugin MUST:
1. Implement `IPlugin` via `BasePlugin` base class
2. Have a valid `plugin.json` with unique `SystemName` (format: `Nop.Plugin.Category.Name`)
3. Register all services in `IServiceCollection` via `IStartup.ConfigureServices()`
4. Use `ISettingService` for all configuration — no `appsettings.json` plugin config
5. Own its database tables with `Nop_Plugin_[SystemName]_` prefix
6. Raise events via `IEventPublisher` — never call another plugin's service directly
7. Handle `IConsumer<T>` events without `async/await` (LAW-3)
8. Implement `Uninstall()` that removes all plugin-owned DB tables and settings

---

## Forbidden Patterns (with incident history)

| Pattern | Why Forbidden | Incident Count |
|---|---|---|
| `new HttpClient()` inside plugin | Socket exhaustion. Use `IHttpClientFactory`. | 2 |
| `Task.Run()` inside `HandleEvent()` | Unobserved exceptions. Fire-and-forget without proper isolation. | 3 |
| `Thread.Sleep()` anywhere | Blocks thread pool. Use `Task.Delay()` or background task. | 1 |
| Direct `DbContext.SaveChanges()` | Bypasses cache invalidation. Use repository. | 3 |
| Singleton service holding `IHttpContextAccessor` state | Concurrency bugs. Per-request state in singleton = shared state. | 1 |
| `string.IsNullOrEmpty(setting)` for feature flags | Settings return empty string, not null, when not set. Use `!string.IsNullOrWhiteSpace()`. | 4 |

---

## AI Collaboration Notes

- Diagrams in `/docs/architecture/` are ground-truth for system structure
- ADRs in `/docs/adr/` explain WHY decisions were made — read before proposing changes
- Runbooks in `/docs/runbooks/` are the ops truth source
- SpecKit specs in `/specs/` define plugin API contracts
- When uncertain about a pattern: check `/docs/adr/` before inventing
```

### Artifact 2 — Skill: cache-aside-multi-store

```csharp
// SKILL: cache-aside-multi-store
// PURPOSE: Correct multi-store cache-aside pattern for nopCommerce
// WHY THIS EXISTS: LAW-1 — RemoveByPrefix behavior differs by deployment topology
// INCIDENT HISTORY: 7 incidents from incorrect cache scope assumptions

// ✓ CORRECT PATTERN
public async Task<IList<Product>> GetFeaturedProductsAsync(int storeId)
{
    // Cache key MUST include storeId for multi-store isolation
    var cacheKey = _staticCacheManager.PrepareKeyForDefaultCache(
        NopCatalogDefaults.FeaturedProductsKey, storeId);

    return await _staticCacheManager.GetAsync(cacheKey, async () =>
    {
        // Only called on cache miss — database query here
        return await _productRepository.GetAllAsync(query =>
            query.Where(p => p.Published && !p.Deleted)
                 .Where(p => !p.LimitedToStores || 
                             _storeMappingService.Authorize(p, storeId)));
    });
}

// When invalidating — use the specific store-scoped key, not a prefix
public async Task InvalidateFeaturedProductsCacheAsync(int storeId)
{
    var cacheKey = _staticCacheManager.PrepareKeyForDefaultCache(
        NopCatalogDefaults.FeaturedProductsKey, storeId);
    await _staticCacheManager.RemoveAsync(cacheKey);
    
    // If you must invalidate ALL stores: enumerate store IDs explicitly
    // DO NOT use RemoveByPrefix in multi-store without understanding deployment topology
}

// ✗ INCORRECT — DO NOT USE
// await _staticCacheManager.RemoveByPrefixAsync(NopCatalogDefaults.FeaturedProductsPrefix);
// Reason: In multi-server, this hits Redis cluster-wide. In single-server, it's node-local.
// The behavior changes without a code change when deployment topology changes.
```

### Artifact 3 — Skill: plugin-event-consumer

```csharp
// SKILL: plugin-event-consumer
// PURPOSE: Correct IConsumer<T> implementation pattern
// WHY THIS EXISTS: LAW-3 — async/await in event handlers causes thread pool starvation
// INCIDENT HISTORY: 2 incidents from async void handlers

// ✓ CORRECT PATTERN — synchronous handler with background offloading
public class OrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly IQueuedEmailService _queuedEmailService;
    private readonly IWorkflowMessageService _workflowMessageService;
    private readonly ILogger<OrderPlacedConsumer> _logger;

    public OrderPlacedConsumer(
        IQueuedEmailService queuedEmailService,
        IWorkflowMessageService workflowMessageService, 
        ILogger<OrderPlacedConsumer> logger)
    {
        _queuedEmailService = queuedEmailService;
        _workflowMessageService = workflowMessageService;
        _logger = logger;
    }

    // HandleEvent MUST be synchronous — no async/await (LAW-3)
    public void HandleEvent(OrderPlacedEvent eventMessage)
    {
        try
        {
            var order = eventMessage.Order;
            
            // ✓ Queue async work via IQueuedEmailService (handled by background task)
            // Do NOT await here — event loop is synchronous
            _workflowMessageService.SendOrderPlacedCustomerNotificationAsync(
                order, order.CustomerLanguageId)
                .GetAwaiter().GetResult(); // Sync-over-async ONLY acceptable here
                // because IWorkflowMessageService only enqueues, doesn't send
            
            // ✓ For truly async work: use IBackgroundTaskQueue (Hangfire)
            // _backgroundTaskQueue.Enqueue(() => ProcessOrderAsync(order.Id));
        }
        catch (Exception ex)
        {
            // Exceptions in event handlers are silently swallowed by IEventPublisher
            // ALWAYS log — otherwise failures are invisible
            _logger.LogError(ex, "Error handling OrderPlacedEvent for order {OrderId}", 
                eventMessage.Order.Id);
        }
    }
}

// ✗ INCORRECT — DO NOT USE
// public async Task HandleEvent(OrderPlacedEvent eventMessage) { ... }
// Reason: IConsumer<T> interface is synchronous. Async implementation causes
// "async over sync" wrapping that blocks thread pool threads under load.
```

### Artifact 4 — SpecKit Spec: OrderPlacedEvent Contract

```yaml
# specs/events/order-placed-event.yaml
# SpecKit specification: OrderPlacedEvent plugin contract

spec_version: "1.0"
entity: "OrderPlacedEvent"
type: "domain-event"
owner: "Nop.Services.Orders"
raised_by: "IOrderService.PlaceOrderAsync()"
last_verified: "2026-06-06"

description: |
  Published synchronously via IEventPublisher after a successful order placement.
  All IConsumer<OrderPlacedEvent> handlers execute in plugin load order (alphabetical
  by plugin folder name). Handlers MUST be synchronous (LAW-3).

payload:
  - field: Order
    type: Order (Nop.Core.Domain.Orders.Order)
    nullable: false
    description: "The fully-persisted order with OrderItems, BillingAddress, ShippingAddress populated"
    guarantee: "OrderId is set and order exists in database before event is published"
  
  - field: Order.OrderStatus
    type: OrderStatus enum
    value_at_publish: "Pending or Processing (depending on payment method)"
    note: "Do not assume Processing — payment plugins may publish before payment confirmed"

consumers_registered:
  - plugin: "Nop.Plugin.Misc.EmailQueue"
    priority: "alpha-first (folder: A_EmailQueue)"
    action: "Enqueues order confirmation email"
    db_writes: ["QueuedEmail table"]
    
  - plugin: "Nop.Plugin.Catalog.Inventory"  
    priority: "alpha-second"
    action: "Decrements Product.StockQuantity"
    db_writes: ["Product.StockQuantity — USE OPTIMISTIC CONCURRENCY (LAW-6)"]
    
  - plugin: "Nop.Plugin.Integration.ERP"
    priority: "alpha-last (folder: Z_ERPIntegration)"
    action: "Inserts ERP sync queue record"
    db_writes: ["ErpSyncQueue table"]
    
  - plugin: "[any new consumer]"
    ordering_rule: "Execution order = alphabetical plugin folder name. Name plugin folders accordingly."

invariants:
  - "Handlers must not throw unhandled exceptions — they are silently swallowed"
  - "Handlers must not read HttpContext — event may publish from background thread"
  - "Handlers must not modify Order.Status — that is IOrderService's responsibility"
  - "Stock decrements must use optimistic concurrency retry (LAW-6)"

breaking_changes:
  - "Adding field to Order payload: non-breaking (existing handlers ignore new fields)"
  - "Changing Order.OrderStatus value at publish time: BREAKING — notify all consumers"
  - "Changing publish timing (before vs after DB commit): BREAKING — all consumers affected"
```

---

## Session Summary

**Duration**: Weeks 6–10 (skills extraction is ongoing, not a single session)

**Deliverables**: Root CLAUDE.md, 8 plugin-level CLAUDE.md files, 8 skills, 12 SpecKit event/API specs

**Key insight from this phase**: The most valuable knowledge to encode is not the correct patterns — it's the incorrect patterns that look correct to a trained developer. Claude can read the codebase and infer "use IRepository". Claude cannot infer "never call ISettingService.GetSettingByKey in Initialize() — it returns null silently."

**Gems extracted from this session:**

> *CLAUDE.md is the team's exocortex. It's not documentation — it's the accumulated context that makes an AI session as knowledgeable as your most senior engineer.*

> *A skill is warranted when the correct implementation requires knowledge not derivable from reading the code. If Claude could figure it out from the source, don't write a skill — write better code.*

> *Skills encode the WHY, not the WHAT. WHAT is already in the code. WHY is in 8 years of production incidents.*

> *The forbidden patterns list is your incident history compressed into constraints. Write it from production data, not from coding standards.*
