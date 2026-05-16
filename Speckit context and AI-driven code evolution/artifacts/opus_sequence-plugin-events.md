# Sequence Diagram — Plugin Event System (IEventPublisher / IConsumer)

**Target path in repo**: `/docs/architecture/sequence-plugin-events.md`  
**Verified**: 2026-05-16 by @arch-lead + @senior-dev-2 (via ILSpy reflection of plugin assemblies)  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Critical reading**: Anyone adding a new `IConsumer<T>` handler MUST read this document first

---

## Plugin Event System Architecture

```mermaid
graph TD
  subgraph Publisher["Event Publishers — any domain service"]
    OS[IOrderService] -->|PublishEvent| EP
    PS[IProductService] -->|PublishEvent| EP
    CS[ICustomerService] -->|PublishEvent| EP
    WMS[IWorkflowMessageService] -->|PublishEvent| EP
  end

  EP[IEventPublisher.Publish<T>]

  subgraph Dispatch["Dispatch — synchronous, alpha-ordered by plugin folder"]
    EP --> H1["1st handler: Nop.Plugin.A_EmailQueue\nIConsumer<OrderPlacedEvent>"]
    EP --> H2["2nd handler: Nop.Plugin.Catalog.Inventory\nIConsumer<OrderPlacedEvent>"]
    EP --> H3["3rd handler: Nop.Plugin.Z_ERPIntegration\nIConsumer<OrderPlacedEvent>"]
    EP --> HN["Nth handler: any future plugin\nExecution order = folder name alpha order"]
  end

  subgraph Safety["Safety Rules — violations cause incidents"]
    R1["LAW-3: void HandleEvent only\nNO async/await"]
    R2["All exceptions must be caught and logged\nIEventPublisher swallows unhandled exceptions silently"]
    R3["Never call another plugin's service directly\nUse IEventPublisher for cross-plugin communication"]
    R4["Never modify the event payload object\nPublisher expects it unchanged after Publish returns"]
  end
```

---

## OrderPlacedEvent — Full Dispatch Sequence

```mermaid
sequenceDiagram
  autonumber
  participant OS as IOrderService
  participant EP as IEventPublisher
  participant H1 as EmailQueuePlugin (folder: A_EmailQueue)
  participant H2 as InventoryPlugin (folder: Catalog.Inventory)
  participant H3 as ERPPlugin (folder: Z_ERPIntegration)
  participant DB as SQL Server
  participant EQ as QueuedEmail table

  Note over OS,EP: Order has been committed to DB. PlaceOrderAsync() calls PublishEvent.
  OS->>EP: Publish(new OrderPlacedEvent(order))
  Note over EP: Resolves all IConsumer<OrderPlacedEvent> from DI container.\nExecution order = Autofac registration order = plugin folder alpha order.\nAll calls are synchronous. EP does not await anything.

  EP->>H1: HandleEvent(OrderPlacedEvent { Order })
  Note over H1: Folder name starts with "A_" — runs first intentionally.
  H1->>EQ: INSERT QueuedEmail { Priority=5, To=customer.Email, Subject, HtmlBody, CreatedOn }
  EQ->>DB: INSERT (synchronous EF Core SaveChanges)
  DB-->>EQ: 1 row affected
  EQ-->>H1: void (no return value)
  H1-->>EP: void (HandleEvent returns)
  Note over H1: Any exception here is SWALLOWED by EP unless caught inside HandleEvent.\nAlways wrap in try/catch and log.

  EP->>H2: HandleEvent(OrderPlacedEvent { Order })
  Note over H2: InventoryPlugin decrements stock. Uses optimistic concurrency (LAW-6).
  loop Retry on DbUpdateConcurrencyException (max 3 attempts)
    H2->>DB: UPDATE Product SET StockQuantity=StockQuantity-{qty} WHERE Id=X AND RowVersion={expected}
    alt Concurrency conflict
      DB-->>H2: DbUpdateConcurrencyException (RowVersion mismatch)
      H2->>DB: SELECT Product WHERE Id=X (reload current RowVersion)
      DB-->>H2: Product { StockQuantity=currentQty, RowVersion=newVersion }
      Note over H2: Recalculate decrement against currentQty, retry UPDATE
    else Success
      DB-->>H2: 1 row affected
      H2-->>EP: void
    end
  end

  EP->>H3: HandleEvent(OrderPlacedEvent { Order })
  Note over H3: Folder name starts with "Z_" — runs last intentionally.\nERPPlugin assumes EmailQueue and Inventory handlers have already run.
  H3->>DB: INSERT ErpSyncQueue { OrderId, Status=Pending, Attempts=0, CreatedOn=NOW }
  DB-->>H3: 1 row affected
  H3-->>EP: void

  EP-->>OS: void (Publish returns after all handlers complete)
  Note over OS,EP: Total event dispatch time = sum of all handler execution times.\nSlower handlers block subsequent handlers. No parallelism.
```

---

## Event Catalogue (nopCommerce Core + Custom)

| Event Type | Published by | Registered Consumers (in execution order) | Notes |
|---|---|---|---|
| `OrderPlacedEvent` | IOrderService | EmailQueuePlugin → InventoryPlugin → ERPPlugin | 3 consumers. Stock write race documented in LAW-6. |
| `OrderPaidEvent` | IOrderService | EmailQueuePlugin (payment confirmation) → ERPPlugin (fulfillment trigger) | 2 consumers. |
| `OrderRefundedEvent` | IOrderService | EmailQueuePlugin (refund confirmation) → InventoryPlugin (stock restore) → ERPPlugin | 3 consumers. Stock restore must be idempotent. |
| `EntityInserted<Product>` | IProductService | SearchIndexPlugin (Elasticsearch indexer) | 1 consumer. Async-safe: uses Fire-and-forget pattern via IBackgroundTaskQueue. Exception here = search index lag, not data loss. |
| `EntityUpdated<Product>` | IProductService | SearchIndexPlugin | Same as above. |
| `CustomerRegisteredEvent` | ICustomerService | EmailQueuePlugin (welcome email) → LoyaltyPlugin (points init) | 2 consumers. |
| `CustomerLoggedInEvent` | ICustomerService | SecurityAuditPlugin | 1 consumer. Must complete in <10ms — login page latency. |

---

## Handler Implementation Contract

Every `IConsumer<T>` implementation MUST follow this pattern exactly:

```csharp
// COMPLIANT handler pattern
public class MyEventConsumer : IConsumer<OrderPlacedEvent>
{
    private readonly IMyService _myService;
    private readonly ILogger<MyEventConsumer> _logger;

    public MyEventConsumer(IMyService myService, ILogger<MyEventConsumer> logger)
    {
        _myService = myService;
        _logger = logger;
    }

    // RULE 1: void return type — NEVER async Task
    public void HandleEvent(OrderPlacedEvent eventMessage)
    {
        // RULE 2: Wrap entire body in try/catch — EP swallows unhandled exceptions silently
        try
        {
            var order = eventMessage.Order;

            // RULE 3: Only synchronous work or synchronous enqueueing of async work
            // OK: synchronous DB write
            _myService.RecordOrderProcessed(order.Id);

            // OK: enqueue for background processing
            // _backgroundTaskQueue.Enqueue(() => SlowAsyncWork(order.Id));

            // NEVER: await SlowAsyncWork(order.Id) — thread pool starvation under load
            // NEVER: Task.Run(() => SlowAsyncWork(order.Id)).Wait() — same problem
        }
        catch (Exception ex)
        {
            // RULE 4: Log the exception — without this, failures are invisible
            _logger.LogError(ex, "Failed handling OrderPlacedEvent for order {OrderId}",
                eventMessage.Order.Id);
            // Do NOT rethrow — EP will swallow it anyway, but rethrowing breaks other handlers
        }
    }
}
```

---

## Execution Order Governance

Plugin event handlers execute in **Autofac DI registration order**, which is **plugin folder alphabetical order**.

This is non-obvious and was discovered during the P0 discovery run as a load-bearing undocumented constraint. Three incidents occurred because:
1. A plugin was renamed, changing its alphabetical position
2. A new plugin was added with a folder name that inserted it between two order-dependent handlers
3. A plugin assumed it ran last (because its business logic required all prior handlers to complete)

**Governance rule (from ADR-001)**: All plugins with ordering dependencies MUST declare this via `[EventHandlerOrder(int priority)]` attribute. Undecorated handlers default to alphabetical. Decorated handlers take precedence. See ADR-001 for full decision record.

---

## Known Incident History (event system)

| Incident | Root Cause | Resolution |
|---|---|---|
| 2024-Q3: Double stock decrement | InventoryPlugin + OrderService both decremented without concurrency check | LAW-6: optimistic concurrency + retry |
| 2025-Q1: Thread pool starvation at checkout peak | Plugin added `async Task HandleEvent` — 300ms async operation × 100 concurrent | LAW-3: sync-only handlers, async work goes to queue |
| 2025-Q2: Missing ERP sync for 48 orders | ERPPlugin renamed folder — ran before EmailPlugin, which expected to run last | ADR-001: EventHandlerOrder attribute introduced |
| 2025-Q4: Silent email queue backlog | Exception in EmailQueuePlugin swallowed by EP, no log written | Required: try/catch + ILogger in all handlers |
