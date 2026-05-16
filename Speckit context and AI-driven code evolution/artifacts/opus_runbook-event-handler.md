# Runbook — Plugin Event Handler Failures (Silent Failures, Thread Pool Starvation, Wrong Order)

**Target path in repo**: `/docs/runbooks/event-handler-failures.md`  
**Owner**: @senior-dev-2  
**Last updated**: 2026-05-16  
**Linked law**: LAW-3 (Event Handler Threading), LAW-6 (Stock Concurrency)  
**Linked ADR**: ADR-001 (Event Handler Ordering)

---

## Three Failure Modes

The `IEventPublisher` / `IConsumer<T>` system has three distinct failure modes with different symptoms and fixes.

| Failure Mode | Symptom | Law | Section |
|---|---|---|---|
| Silent exception swallowed | Handler action not performed, no error shown | LAW-3 | [Section A](#section-a) |
| Thread pool starvation | Checkout slow/hanging under load, 503s at peak | LAW-3 | [Section B](#section-b) |
| Wrong execution order | Business logic assumption violated (ERP before email, etc.) | ADR-001 | [Section C](#section-c) |

---

## Section A — Silent Exception (Handler Action Not Performed) {#section-a}

### Symptom
- Order placed successfully but confirmation email never queued
- Stock not decremented after order placement
- ERP sync queue not populated for specific orders
- No error in logs, no exception in Application Insights

### Root Cause
`IEventPublisher` catches ALL unhandled exceptions from handlers and swallows them — by design, to prevent one failing handler from blocking others. If a handler does not catch its own exceptions and log them, failures are completely invisible.

```csharp
// IEventPublisher internal behavior (Nop.Services.Events.EventPublisher)
foreach (var consumer in consumers)
{
    try
    {
        consumer.HandleEvent(eventMessage);
    }
    catch (Exception ex)
    {
        // SILENTLY SWALLOWED — no re-throw, no log
        // Your handler's exception disappears here
    }
}
```

### Diagnosis

**Step 1** — Check Application Insights for handler exceptions that made it to the log:
```kusto
// KQL — search for handler-related errors
exceptions
| where timestamp > ago(24h)
| where outerMessage contains "HandleEvent" or outerMessage contains "Consumer"
| project timestamp, outerMessage, innermostMessage, operation_Id
| order by timestamp desc
```

If nothing appears, the handler is not logging its exceptions (it should be).

**Step 2** — Identify the failing handler:
```bash
# Find all IConsumer implementations
grep -rn "IConsumer<" src/Plugins/ --include="*.cs" -l
```

**Step 3** — Check each handler for missing try/catch:
```csharp
// WRONG — exception escapes to EventPublisher, gets swallowed silently
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    _myService.DoWork(eventMessage.Order.Id);  // If this throws, no log, no error
}

// CORRECT — exception caught and logged inside handler
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    try
    {
        _myService.DoWork(eventMessage.Order.Id);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed handling OrderPlacedEvent for order {OrderId}",
            eventMessage.Order.Id);
        // Do NOT rethrow — EP will swallow it anyway, but rethrowing may affect other handlers
    }
}
```

### Fix

Add try/catch + ILogger to every `HandleEvent` body that is missing it. This is LAW-3, Rule 2.

**Verification**: After fix, re-trigger the failing scenario. Confirm the error now appears in Application Insights:
```kusto
traces
| where timestamp > ago(1h)
| where severityLevel == 3 // Error
| where message contains "HandleEvent" or message contains "OrderPlacedEvent"
| project timestamp, message, operation_Id
```

---

## Section B — Thread Pool Starvation (Slow Checkout Under Load) {#section-b}

### Symptom
- Checkout response time increases significantly under load (>50 concurrent users)
- ThreadPool queue depth rising in Application Insights performance counters
- `TaskCanceledException` or `OperationCanceledException` in checkout logs at peak
- Requests timing out at the gateway (504) while app is running

### Root Cause
A handler used `async Task HandleEvent` or called `.Wait()` / `.Result` inside a synchronous handler. Under load, this causes thread pool starvation:

```csharp
// ILLEGAL — LAW-3 violation: async handler
public async Task HandleEvent(OrderPlacedEvent eventMessage)  // WRONG return type
{
    await _slowExternalService.CallAsync(eventMessage.Order);  // 300ms async op
}

// ALSO ILLEGAL — sync-over-async causes deadlock/starvation
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    _slowExternalService.CallAsync(eventMessage.Order).Wait();  // Deadlock risk
    // OR:
    _slowExternalService.CallAsync(eventMessage.Order).GetAwaiter().GetResult();
}
```

At 100 concurrent checkouts × 300ms blocked thread = 30 seconds of thread pool saturation.

### Diagnosis

**Step 1** — Find async handlers or sync-over-async:
```bash
# Find async HandleEvent (wrong signature)
grep -rn "async.*HandleEvent\|Task HandleEvent" src/Plugins/ --include="*.cs"

# Find .Wait() or .GetAwaiter().GetResult() inside HandleEvent
grep -rn "\.Wait()\|\.GetAwaiter()\.GetResult()" src/Plugins/ --include="*.cs"
```

**Step 2** — Check thread pool metrics in Application Insights:
```kusto
performanceCounters
| where timestamp > ago(2h)
| where name contains "Thread"
| project timestamp, name, value
| order by timestamp asc
```

**Step 3** — Correlate with checkout latency:
```kusto
requests
| where timestamp > ago(2h)
| where name contains "checkout" or name contains "Checkout"
| summarize avg(duration), percentile(duration, 95), percentile(duration, 99) by bin(timestamp, 5m)
| order by timestamp asc
```

### Fix

**Option 1 (Preferred)**: Keep handler synchronous, enqueue async work to background:

```csharp
// CORRECT — handler is void, enqueues to IBackgroundTaskQueue
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    try
    {
        var orderId = eventMessage.Order.Id;
        // Enqueue — returns immediately, async work runs in background
        _backgroundTaskQueue.QueueBackgroundWorkItem(async token =>
        {
            await _slowExternalService.CallAsync(orderId, token);
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed queueing background work for order {OrderId}",
            eventMessage.Order.Id);
    }
}
```

**Option 2**: If the work MUST be synchronous (DB write in same transaction), ensure it is a fast synchronous operation:

```csharp
// ACCEPTABLE — synchronous DB write, fast (<10ms expected)
public void HandleEvent(OrderPlacedEvent eventMessage)
{
    try
    {
        _syncDbService.InsertRecord(eventMessage.Order.Id);  // Synchronous EF Core SaveChanges
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "...");
    }
}
```

**Never**: Call external HTTP APIs synchronously inside a handler. Always enqueue.

---

## Section C — Wrong Execution Order (Business Logic Assumption Violated) {#section-c}

### Symptom
- ERP receives order before confirmation email is queued (race visible in ERP logs)
- Stock decremented in wrong sequence relative to order status update
- A handler that "depends on" another handler's output runs before it

### Root Cause
Plugin folder was renamed, new plugin inserted alphabetically between ordered plugins, or `[EventHandlerOrder]` attribute was not applied. See ADR-001.

### Diagnosis

**Step 1** — List all plugins in alphabetical order:
```bash
ls -la src/Plugins/ | sort
# Windows:
dir src\Plugins\ /ad /b | sort
```

Compare to expected order (from `sequence-plugin-events.md`).

**Step 2** — Check for missing `[EventHandlerOrder]` attribute:
```bash
grep -rn "IConsumer<OrderPlacedEvent>" src/Plugins/ --include="*.cs" -l | while read f; do
  echo "=== $f ==="
  grep -n "EventHandlerOrder\|class.*IConsumer" "$f"
done
```

**Step 3** — Verify actual dispatch order at runtime via logging:

Temporarily add ILogger.LogInformation at the start of each handler's try block, trigger the event, and check Application Insights for the sequence of log entries.

```kusto
traces
| where timestamp > ago(1h)
| where message contains "HandleEvent started"
| project timestamp, message, operation_Id
| order by timestamp asc
```

### Fix

1. Add `[EventHandlerOrder(priority)]` to the handler class (ADR-001):
   ```csharp
   [EventHandlerOrder(100)]  // Lower number = earlier
   public class EmailQueueOrderPlacedConsumer : IConsumer<OrderPlacedEvent> { }

   [EventHandlerOrder(900)]  // Higher number = later
   public class ERPSyncOrderPlacedConsumer : IConsumer<OrderPlacedEvent> { }
   ```

2. If `[EventHandlerOrder]` Autofac hook is not deployed yet: rename plugin folder to enforce alpha order:
   - Must-run-first plugins: prefix folder with `A_`
   - Must-run-last plugins: prefix folder with `Z_`

3. Update FRESHNESS.md and `sequence-plugin-events.md` event catalogue if handler order changed.

---

## Incident Response Checklist

When a checkout/order event handler failure is reported in production:

- [ ] **Triage**: which handler is failing? (email, inventory, ERP, or other?)
- [ ] **Impact**: are orders being placed successfully? (IEventPublisher failure does NOT roll back order)
- [ ] **Immediate**: if email not queueing — can the email be sent manually from admin? (Admin → Orders → {Order} → Send email)
- [ ] **Immediate**: if stock not decremented — is product oversold? Check `Product.StockQuantity` vs `OrderItem.Quantity` sum
- [ ] **Immediate**: if ERP not receiving — trigger manual ERP sync from admin panel (Admin → System → Schedule Tasks → ERP Sync)
- [ ] **Root cause**: identify which failure mode (Section A/B/C)
- [ ] **Fix**: apply fix per relevant section, deploy
- [ ] **Verify**: confirm handler logs appearing in Application Insights post-fix
- [ ] **Post-mortem**: update relevant runbook or add a new incident row to `sequence-plugin-events.md`
