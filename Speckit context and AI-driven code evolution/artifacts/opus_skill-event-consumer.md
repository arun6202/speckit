# Skill: plugin-event-consumer

**Target path in repo**: `/skills/plugin-event-consumer.md`  
**Applies law**: LAW-3 (Event Handler Threading), ADR-001 (Execution Order)  
**Source**: Derived from 4 production event-system incidents. Reviewed by @arch-lead 2026-05-16.  
**When to use**: Any time you create or modify an `IConsumer<T>` implementation

---

## Complete Compliant Handler Template

```csharp
using Microsoft.Extensions.Logging;
using Nop.Core.Events;
using Nop.Core.Domain.Orders;
using Nop.Services.Events;
using Nop.Plugin.YourPlugin.Services;

namespace Nop.Plugin.YourPlugin.Infrastructure;

// ─────────────────────────────────────────────────────────────────────────────
// EventHandlerOrder attribute:
//   100-499 → early handlers (folder prefix: A_)
//   500     → unordered default (no prefix required)
//   900-999 → late handlers (folder prefix: Z_)
//
// REQUIRED if this handler has an ordering dependency on another handler.
// See ADR-001 for the full ordering governance rule.
// ─────────────────────────────────────────────────────────────────────────────
[EventHandlerOrder(500)]  // Adjust per ADR-001 if ordering dependency exists
public class YourOrderPlacedConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly IYourPluginService _yourService;
    private readonly IBackgroundTaskQueue _backgroundQueue;  // For slow/async work
    private readonly ILogger<YourOrderPlacedConsumer> _logger;

    public YourOrderPlacedConsumer(
        IYourPluginService yourService,
        IBackgroundTaskQueue backgroundQueue,
        ILogger<YourOrderPlacedConsumer> logger)
    {
        _yourService = yourService;
        _backgroundQueue = backgroundQueue;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RULE 1: void return type — NEVER async Task
    //         IEventPublisher calls this synchronously on the request thread.
    //         async Task here causes thread pool starvation under load (LAW-3).
    // ─────────────────────────────────────────────────────────────────────────
    public void HandleEvent(OrderPlacedEvent eventMessage)
    {
        // ─────────────────────────────────────────────────────────────────────
        // RULE 2: Entire body in try/catch
        //         IEventPublisher swallows unhandled exceptions SILENTLY.
        //         If this throws without a catch, the failure is invisible:
        //         no log, no error response, no alert. (2025-Q4 incident)
        // ─────────────────────────────────────────────────────────────────────
        try
        {
            var order = eventMessage.Order;

            // ─────────────────────────────────────────────────────────────────
            // RULE 3: Synchronous work only — or synchronous enqueue of async work
            // ─────────────────────────────────────────────────────────────────

            // OPTION A: Fast synchronous DB write (< 50ms expected)
            _yourService.RecordOrderSync(order.Id);

            // OPTION B: Slow work or external API call → enqueue to background
            // _backgroundQueue.QueueBackgroundWorkItem(async cancellationToken =>
            // {
            //     await _yourService.SlowExternalCallAsync(order.Id, cancellationToken);
            // });

            // ─────────────────────────────────────────────────────────────────
            // RULE 4: Never modify eventMessage.Order
            //         The publisher expects the payload unchanged after Publish returns.
            //         If you need to modify order state, use IOrderService.UpdateOrderAsync.
            // ─────────────────────────────────────────────────────────────────
        }
        catch (Exception ex)
        {
            // ─────────────────────────────────────────────────────────────────
            // RULE 5: Log the exception — without this, failures are invisible
            //         Do NOT rethrow — EP will swallow it anyway, but rethrowing
            //         causes EP to abort processing for remaining handlers.
            // ─────────────────────────────────────────────────────────────────
            _logger.LogError(ex,
                "Failed handling OrderPlacedEvent for order {OrderId}",
                eventMessage.Order?.Id);
        }
    }
}
```

---

## Handler Registration

Register the consumer in the plugin's `Infrastructure/DependencyRegistrar.cs`:

```csharp
public class DependencyRegistrar : IDependencyRegistrar
{
    public void Register(ContainerBuilder builder, ITypeFinder typeFinder)
    {
        // Register your plugin service
        builder.RegisterType<YourPluginService>()
            .As<IYourPluginService>()
            .InstancePerLifetimeScope();

        // IConsumer<T> registrations are auto-discovered by reflection in AutofacRegistrar
        // You do NOT manually register IConsumer<T> — but verify your assembly is scanned
    }

    public int Order => 1;
}
```

IConsumer<T> implementations are auto-registered by `AutofacRegistrar` via reflection — any class implementing `IConsumer<T>` in a plugin assembly is registered automatically. Verify your handler is discovered:

```bash
# Enable Autofac debug logging in appsettings.Development.json:
# "Autofac": { "LogLevel": "Debug" }
# Search logs for your consumer class name on startup
```

---

## Execution Order Declaration

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// Case 1: Handler must run FIRST (e.g., email queue before ERP reads state)
// ─────────────────────────────────────────────────────────────────────────────
[EventHandlerOrder(100)]  // Low number = early
// Plugin folder name MUST start with "A_": /Plugins/Nop.Plugin.A_YourPlugin/

// ─────────────────────────────────────────────────────────────────────────────
// Case 2: Handler has no ordering dependency
// ─────────────────────────────────────────────────────────────────────────────
[EventHandlerOrder(500)]  // Default
// Plugin folder: any name without A_ or Z_ prefix

// ─────────────────────────────────────────────────────────────────────────────
// Case 3: Handler must run LAST (e.g., ERP sync after email and inventory)
// ─────────────────────────────────────────────────────────────────────────────
[EventHandlerOrder(900)]  // High number = late
// Plugin folder name MUST start with "Z_": /Plugins/Nop.Plugin.Z_YourPlugin/
```

---

## Background Queue Pattern (for Slow Work)

When the handler logic calls an external API, does heavy computation, or takes > 50ms:

```csharp
// Inside HandleEvent try block:
var orderId = eventMessage.Order.Id;  // Capture before async — order may be GC'd

_backgroundQueue.QueueBackgroundWorkItem(async cancellationToken =>
{
    // This runs on a background thread, not the request thread
    // IServiceScopeFactory needed — inject in constructor:
    using var scope = _serviceScopeFactory.CreateScope();
    var service = scope.ServiceProvider.GetRequiredService<IYourPluginService>();
    
    try
    {
        await service.SlowExternalCallAsync(orderId, cancellationToken);
    }
    catch (Exception ex)
    {
        // ILogger injected from scope
        var logger = scope.ServiceProvider
            .GetRequiredService<ILogger<YourOrderPlacedConsumer>>();
        logger.LogError(ex, "Background task failed for order {OrderId}", orderId);
    }
});
// Returns immediately — request thread unblocked
```

---

## What NOT to Do

```csharp
// ❌ async Task return — thread pool starvation at peak load
public async Task HandleEvent(OrderPlacedEvent eventMessage) { }

// ❌ .Wait() sync-over-async — deadlock risk + thread pool exhaustion
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    _service.SlowCallAsync(eventMessage.Order.Id).Wait();
}

// ❌ No try/catch — exception swallowed by EP, handler failure invisible
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    _service.DoWork(eventMessage.Order.Id);  // If this throws: silence
}

// ❌ Modifying the event payload
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    eventMessage.Order.OrderStatus = OrderStatus.Processing;  // DO NOT do this
}

// ❌ Cross-plugin direct service call — use IEventPublisher instead
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    _otherPluginService.DoSomething();  // Tight coupling between plugins
}
// Correct approach: publish a new event that the other plugin subscribes to
```

---

## Event Catalogue Quick Reference

Refer to `/docs/architecture/sequence-plugin-events.md` for the full catalogue. Key events:

| Event | Triggered by | Your handler typically does |
|---|---|---|
| `OrderPlacedEvent` | `IOrderService.PlaceOrderAsync` | Email queue, stock decrement, ERP sync |
| `OrderPaidEvent` | `IOrderService.MarkOrderAsPaidAsync` | Email notification, fulfillment trigger |
| `OrderRefundedEvent` | `IOrderService.RefundAsync` | Email, stock restore (full refund only), ERP |
| `EntityInserted<Product>` | `IProductService.InsertProductAsync` | Search index update |
| `EntityUpdated<Product>` | `IProductService.UpdateProductAsync` | Search index update, cache invalidation |
| `CustomerRegisteredEvent` | `ICustomerService.RegisterCustomerAsync` | Welcome email, loyalty init |

---

## Verification Checklist

Before submitting a handler:

- [ ] Return type is `void` (not `Task`, not `async Task`)
- [ ] Entire body inside `try { } catch (Exception ex) { _logger.LogError... }`
- [ ] No `.Wait()`, `.Result`, `.GetAwaiter().GetResult()` anywhere in the handler body
- [ ] Slow or external-API work enqueued to `IBackgroundTaskQueue`
- [ ] `[EventHandlerOrder]` attribute present and correct if ordering dependency exists
- [ ] Plugin folder prefix (`A_` or `Z_`) matches the `[EventHandlerOrder]` priority range
- [ ] Handler registered in `/specs/{plugin-name}.yaml` SpecKit spec (if plugin has a spec)
