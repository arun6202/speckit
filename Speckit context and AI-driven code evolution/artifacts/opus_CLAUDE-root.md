# CLAUDE.md — Root Context (nopCommerce Platform)

**Target path in repo**: `/CLAUDE.md`  
**Owner**: @arch-lead  
**Last updated**: 2026-05-16  
**Status**: AUTHORITATIVE — read this file at the start of every Claude Code session

---

## What This Codebase Is

nopCommerce ASP.NET Core 8 multi-store e-commerce platform. ~200 plugins. SQL Server 2019. Redis 6. Azure App Service (2 instances, auto-scales to 4). Plugin architecture: every feature extension is an `IPlugin` assembly loaded from `/Plugins/`. Autofac DI. Razor Pages + MVC storefront + admin panel.

---

## Production Laws

These rules are derived from 24 production incidents. Violating them has caused P0s. Read before writing any code.

### LAW-1: Cache Invalidation Scope

`IStaticCacheManager.RemoveByPrefixAsync()` is **node-local** in single-server deployment (local dev) and **Redis-wide** in multi-server deployment (production Azure App Service with 2+ instances).

**We are multi-server in production.** Always use `RemoveAsync(specificKey)` for targeted cache invalidation. Never use `RemoveByPrefixAsync` unless you have confirmed this is a deliberate full-group invalidation AND deployment is single-node (it is not in production).

```csharp
// CORRECT
await _cacheManager.RemoveAsync(
    NopModelCacheDefaults.ProductDetailsCacheKey.FillCacheKey(product.Id, storeId));

// WRONG in production (works in local dev, silently fails in prod)
await _cacheManager.RemoveByPrefixAsync(NopProductDefaults.ProductsByIdsPrefix);
```

### LAW-2: StoreId Semantics Differ by Table

`StoreId=0` means different things in different tables:

| Table | StoreId=0 Means |
|---|---|
| `Setting` | Global default — fallback if no store-specific record exists |
| `Order` | Invalid/unassigned — error state, no valid order has StoreId=0 |
| `Customer` | No store affiliation — admin-created or migrated customers |

**Always use `ISettingService` API for settings — never raw LINQ on the Setting table.** Pass `loadSharedValueIfNotFound: true` and use `_storeContext.CurrentStore.Id` (not 0).

```csharp
// CORRECT
var enabled = await _settingService.GetSettingByKeyAsync<bool>(
    "Plugin.FeatureEnabled",
    defaultValue: false,
    storeId: (await _storeContext.GetCurrentStoreAsync()).Id,
    loadSharedValueIfNotFound: true);

// WRONG — skips store-specific overrides, reads global only
var wrong = await _settingService.GetSettingByKeyAsync<bool>("Plugin.FeatureEnabled", storeId: 0);
```

### LAW-3: Event Handler Threading — No async/await

`IConsumer<T>.HandleEvent()` MUST be `void`. NEVER `async Task`. NEVER `.Wait()` or `.GetAwaiter().GetResult()` inside a synchronous handler.

**Root cause**: `IEventPublisher` calls handlers synchronously on the request thread. Async handlers + `.Wait()` causes thread pool starvation at checkout peak (2025-Q1: 300ms async × 100 concurrent → site down).

**If the work is slow or calls external APIs**: enqueue to `IBackgroundTaskQueue` inside the synchronous handler and return immediately.

Every handler MUST catch all exceptions internally. `IEventPublisher` swallows unhandled exceptions silently — no log, no error, no indication of failure.

```csharp
// CORRECT handler pattern
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    try
    {
        _syncService.DoSynchronousWork(eventMessage.Order.Id);
        // For async/slow work: _backgroundQueue.Enqueue(() => SlowAsync(orderId));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed handling OrderPlacedEvent for order {OrderId}",
            eventMessage.Order.Id);
        // Do NOT rethrow
    }
}
```

### LAW-4: Settings Read Timing

`IPlugin.Initialize()` is called during app startup **before** `IStoreContext` is initialized. Any `ISettingService.GetSettingByKey()` call inside `Initialize()` returns `null` silently — no exception, no warning.

**Never read settings in `Initialize()`.** Read lazily: on the first request handler call, via constructor injection of the service (not the setting value), or via `Lazy<T>`.

```csharp
// WRONG — returns null silently
public override void Initialize()
{
    var enabled = _settingService.GetSettingByKey<bool>("Plugin.Enabled");  // null
}

// CORRECT — read when handling a real request
public async Task<bool> IsEnabledAsync()
{
    var storeId = (await _storeContext.GetCurrentStoreAsync()).Id;
    return await _settingService.GetSettingByKeyAsync<bool>(
        "Plugin.Enabled", storeId: storeId, loadSharedValueIfNotFound: true);
}
```

### LAW-5: Repository Boundary — No Direct DbContext Access

`IRepository<T>` is the ONLY sanctioned data access pattern outside `Nop.Data`. Never inject `NopDbContext` directly into a plugin or service in `Nop.Services`. Direct DbContext access bypasses:
- Cache invalidation (entity change notifications do not fire)
- Soft-delete filters (`WHERE Deleted=0` is applied by repository, not by raw DbContext)
- Multi-store entity filtering

```csharp
// WRONG — bypasses cache invalidation and soft-delete
private readonly NopDbContext _context;
var products = _context.Products.Where(p => p.Published).ToList();

// CORRECT — use IRepository which wraps DbContext correctly
private readonly IRepository<Product> _productRepository;
var products = await _productRepository.GetAllAsync(q => q.Where(p => p.Published));
```

### LAW-6: Stock Update Concurrency — Optimistic Concurrency + Retry

`Product.StockQuantity` is written by both `IOrderService.PlaceOrder()` (inside SERIALIZABLE transaction) and `InventoryPlugin.HandleEvent()` (after event dispatch). Both code paths write to the same column on order placement.

Handle `DbUpdateConcurrencyException` with a reload-and-retry pattern. Maximum 3 attempts. Never use pessimistic locking (`UPDLOCK` hints).

```csharp
// CORRECT stock update pattern
const int maxRetries = 3;
for (var attempt = 0; attempt < maxRetries; attempt++)
{
    try
    {
        var product = await _productRepository.GetByIdAsync(productId);
        product.StockQuantity -= orderedQuantity;
        await _productRepository.UpdateAsync(product);
        break;
    }
    catch (DbUpdateConcurrencyException)
    {
        if (attempt == maxRetries - 1) throw;
        // Reload and retry — reload is inside the loop
    }
}
```

---

## Architecture Quick Reference

```
/src/
  Nop.Core/          — Domain entities, interfaces, cache key definitions
  Nop.Data/          — EF Core DbContext, IRepository<T>, migrations
  Nop.Services/      — Business logic (IOrderService, IProductService, etc.)
  Nop.Web/           — ASP.NET Core host, MVC controllers, Razor views
  Nop.Web.Framework/ — Plugin engine, Autofac registration, widget rendering

/Plugins/            — One folder per plugin. Folder name = load order (alphabetical)
/docs/architecture/  — C4 diagrams (Mermaid), verified by @arch-lead
/docs/adr/           — Architecture Decision Records
/docs/runbooks/      — Operational runbooks for known failure patterns
/skills/             — Claude Code skill files (.md) for common patterns
/specs/              — SpecKit YAML specs for plugin API contracts
```

Key service interfaces (all in `Nop.Services`):
- `IOrderService` — order lifecycle (place, cancel, refund)
- `IProductService` — product CRUD, stock
- `ICustomerService` — customer lifecycle, auth
- `IEventPublisher` — sync event dispatch to `IConsumer<T>` handlers
- `IStaticCacheManager` — Redis cache (LAW-1 applies)
- `ISettingService` — plugin settings (LAW-2, LAW-4 apply)
- `IRepository<T>` — data access (LAW-5 applies)
- `IWorkflowMessageService` — email workflow trigger (enqueues to QueuedEmail table)

---

## Plugin Development Checklist

Before submitting a PR for a new or modified plugin:

- [ ] `IConsumer<T>.HandleEvent()` is `void` — not `async Task` (LAW-3)
- [ ] All `HandleEvent` bodies wrapped in `try { } catch (Exception ex) { _logger.LogError... }` (LAW-3)
- [ ] Settings read via `ISettingService.GetSettingByKeyAsync()` with `storeId` and `loadSharedValueIfNotFound: true` (LAW-2)
- [ ] No settings read inside `IPlugin.Initialize()` (LAW-4)
- [ ] No direct `NopDbContext` injection — use `IRepository<T>` (LAW-5)
- [ ] Cache invalidation uses `RemoveAsync(specificKey)` not `RemoveByPrefixAsync` (LAW-1)
- [ ] Stock updates use optimistic concurrency + retry (LAW-6)
- [ ] Plugin has a SpecKit spec in `/specs/` if it exposes an API or publishes/consumes events
- [ ] Plugin folder name follows naming convention (prefix `A_` or `Z_` if ordering is required per ADR-001)
- [ ] `[EventHandlerOrder(int)]` attribute on consumers with ordering dependencies (ADR-001)

---

## Multi-Agent Session Rules (Phase 3+)

When this session is executing a task from an Opus-authored task specification:

1. **Do not expand scope** beyond what the task spec defines. If you discover a scope-impacting issue, emit `[ARCH-EXCEPTION]` and describe it. Do not fix it — record it and continue.
2. **Emit `[ARCH-EXCEPTION]` when**: the task would require modifying interfaces in `Nop.Core`, adding new migration, changing a `IConsumer<T>` execution order, or touching any of the 6 production laws.
3. **Task spec fields**: check `relevant_laws`, `applicable_skills`, and `architectural_constraints` in the task spec before writing any code.
4. **Read the applicable skill file(s)** from `/skills/` before implementing the pattern.
5. **SpecKit compliance**: if the task touches a plugin with a SpecKit spec in `/specs/`, verify your implementation matches the spec before completion.

---

## Linked Documents

- `/docs/architecture/FRESHNESS.md` — diagram verification register
- `/docs/adr/ADR-000-diagram-tooling.md` — why Mermaid, discovery-before-diagram
- `/docs/adr/ADR-001-event-handler-ordering.md` — why alpha order is a law
- `/docs/adr/ADR-002-settings-storeid.md` — StoreId semantics decision record
- `/docs/runbooks/plugin-settings-not-loading.md` — LAW-4 + LAW-2 diagnosis
- `/docs/runbooks/cache-invalidation.md` — LAW-1 diagnosis
- `/docs/runbooks/event-handler-failures.md` — LAW-3 diagnosis
- `/skills/cache-aside-multi-store.md` — LAW-1 compliant cache pattern
- `/skills/plugin-event-consumer.md` — LAW-3 compliant handler pattern
- `/skills/plugin-settings.md` — LAW-4 + LAW-2 compliant settings pattern
- `/skills/repository-pattern.md` — LAW-5 compliant data access
