# ADR-001 — Plugin Event Handler Execution Order: Make Alphabetical Order Explicit

**Target path in repo**: `/docs/adr/ADR-001-event-handler-ordering.md`  
**Status**: Accepted  
**Date**: 2026-05-16  
**Deciders**: @arch-lead, @senior-dev-1, @senior-dev-2  
**Supersedes**: None — formalizes an undocumented constraint discovered in Phase 0

---

## Context

During the Phase 0 discovery run, we found that `IEventPublisher` dispatches `IConsumer<T>` handlers in the order they are registered in the Autofac DI container. Autofac registers plugins in the order they are loaded by `PluginLoader`. `PluginLoader` scans `/Plugins/` subdirectories in **alphabetical order** of folder name.

This means:
- **`Nop.Plugin.A_EmailQueue`** always runs before **`Nop.Plugin.Z_ERPIntegration`**
- Adding a new plugin with folder `Nop.Plugin.C_SomePlugin` inserts it between `A_*` and `Z_*` plugins
- Renaming a plugin folder changes its execution position

This was discovered **after three production incidents** (see Incident History below). The constraint was load-bearing but completely undocumented. Developers did not know that folder names determined handler order.

---

## Decision

1. **Document alphabetical-by-folder-name as the default execution order** for `IConsumer<T>` handlers. This is now LAW in CLAUDE.md (see Phase 2 root CLAUDE.md).

2. **Introduce `[EventHandlerOrder(int priority)]` attribute** for plugins with explicit ordering requirements. Decorated handlers run before undecorated handlers. Among decorated handlers, lower priority number = earlier execution. Undecorated handlers execute in alpha order after all decorated handlers.

3. **Naming convention for known-order plugins**:
   - Prefix folder with `A_` for handlers that must run first (e.g., `A_EmailQueue`)
   - Prefix folder with `Z_` for handlers that must run last (e.g., `Z_ERPIntegration`)
   - Unprefixed plugins execute between `A_*` and `Z_*` in alpha order

4. **All plugins with ordering dependencies MUST declare this via `[EventHandlerOrder]` AND use folder prefix**. Dual declaration ensures order is enforced even if attribute is not yet hooked into Autofac registration.

5. **CLAUDE.md rule**: When Claude Code generates a new `IConsumer<T>` handler, it must prompt the developer to confirm whether the handler has ordering dependencies. If yes, generate with `[EventHandlerOrder]` attribute and suggest folder prefix.

---

## `[EventHandlerOrder]` Attribute Specification

```csharp
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class EventHandlerOrderAttribute : Attribute
{
    public int Priority { get; }

    // Lower number = earlier execution.
    // 0-99: reserved for core handlers
    // 100-499: plugins that must run early (use A_ folder prefix)
    // 500: default (undecorated handlers fall here alphabetically)
    // 501-899: plugins that run mid-order
    // 900-999: plugins that must run last (use Z_ folder prefix)
    public EventHandlerOrderAttribute(int priority)
    {
        Priority = priority;
    }
}

// Example usage — email handler must run before ERP
[EventHandlerOrder(100)]
public class EmailQueueOrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    public void HandleEvent(OrderPlacedEvent eventMessage) { /* ... */ }
}

[EventHandlerOrder(900)]
public class ERPSyncOrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    public void HandleEvent(OrderPlacedEvent eventMessage) { /* ... */ }
}
```

Autofac registration respects `[EventHandlerOrder]` via a custom `IRegistrationSource` that sorts `IConsumer<T>` registrations by priority before building the resolved list.

---

## Rationale

**Why not just document the alpha-order and leave it?**

Alpha-order is fragile. It breaks when:
- A plugin is renamed (business reason, not ordering reason)
- A new plugin is added with a name that accidentally inserts it between ordered handlers
- A developer doesn't know the naming convention

An explicit attribute makes the dependency visible in code, not just in documentation. When a developer reads `ERPSyncOrderPlacedConsumer`, they see `[EventHandlerOrder(900)]` and know it is intentionally last.

**Why keep the folder prefix convention as well?**

`[EventHandlerOrder]` requires the Autofac registration hook to be in place. During the transition period, the hook may not be deployed. Folder prefix is a belt-and-suspenders backup that works even without the attribute hook. Also: the folder name is visible in the filesystem without opening any C# file — operations team can see ordering at a glance.

**Why not use a configuration file to define order?**

A config file is yet another artifact to keep in sync. The attribute lives next to the code it affects. FRESHNESS.md already tracks diagrams; a separate ordering config would need its own freshness policy.

---

## Current Handler Order (as of 2026-05-16)

| Plugin Folder | Priority | Handles | Intentional? |
|---|---|---|---|
| `Nop.Plugin.A_EmailQueue` | 100 | `OrderPlacedEvent`, `OrderPaidEvent`, `OrderRefundedEvent`, `CustomerRegisteredEvent` | Yes — email must queue before ERP reads order state |
| `Nop.Plugin.Catalog.Inventory` | 500 (default) | `OrderPlacedEvent`, `OrderRefundedEvent` | Unordered — stock decrement is idempotent via optimistic concurrency |
| `Nop.Plugin.Search.Elasticsearch` | 500 (default) | `EntityInserted<Product>`, `EntityUpdated<Product>` | Unordered — search index lag is acceptable |
| `Nop.Plugin.Z_ERPIntegration` | 900 | `OrderPlacedEvent`, `OrderPaidEvent`, `OrderRefundedEvent` | Yes — ERP assumes email and inventory handlers have already run |

---

## Incident History (triggered this ADR)

| Incident | Date | Root Cause |
|---|---|---|
| Missing ERP sync for 48 orders | 2025-Q2 | ERPPlugin folder renamed from `Z_ERP...` to `ERP...` — alphabetically moved before EmailPlugin, which set state ERP depended on |
| Inventory double-decrement | 2024-Q3 | New plugin inserted alphabetically between inventory and stock-guard handlers | 
| Customer welcome email sent before loyalty points initialized | 2025-Q3 | LoyaltyPlugin folder `AAA_Loyalty` accidentally sorted before `A_EmailQueue` |

All three incidents had the same root cause: an implicit ordering constraint violated by a folder rename or new plugin. This ADR makes ordering explicit and enforced.

---

## Consequences

**Positive**:
- Ordering dependency visible in source code — not just tribal knowledge
- Folder prefix remains as backup for ops/deployment visibility
- Claude Code can check `[EventHandlerOrder]` when generating new consumers
- CI can warn when a new `IConsumer<T>` is added without `[EventHandlerOrder]` if it's in a known-ordered plugin

**Negative**:
- Requires Autofac registration hook implementation and deployment
- Transition period: attribute deployed but existing handlers need decoration (one-sprint migration)
- If attribute hook is not deployed, attribute is documentation-only — folder naming is still the enforced mechanism

**Migration plan**: Sprint 1 after ADR acceptance — add `[EventHandlerOrder]` to all existing consumers, deploy Autofac hook, verify order in integration tests.
