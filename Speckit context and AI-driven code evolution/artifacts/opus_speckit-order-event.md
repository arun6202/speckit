# SpecKit Spec — OrderPlacedEvent

**Target path in repo**: `/specs/order-placed-event.yaml`  
**Owner**: @senior-dev-1  
**Status**: Approved  
**Version**: 1.2.0  
**Last updated**: 2026-05-16  
**Verified by**: @arch-lead (against ILSpy reflection of Nop.Core + staging event traces)

---

## YAML Spec

```yaml
# SpecKit specification for OrderPlacedEvent
# Any plugin implementing IConsumer<OrderPlacedEvent> MUST conform to this spec.
# CI gate validates conformance on every PR touching a plugin in this event's consumer list.

spec_version: "1.0"
name: "OrderPlacedEvent"
description: >
  Published by IOrderService.PlaceOrderAsync immediately after the order transaction commits.
  All IConsumer<OrderPlacedEvent> handlers execute synchronously on the checkout request thread
  before PlaceOrderAsync returns. Total handler execution time directly adds to checkout latency.

event:
  type: "Nop.Core.Domain.Orders.OrderPlacedEvent"
  namespace: "Nop.Core.Domain.Orders"
  assembly: "Nop.Core"
  published_by:
    - service: "IOrderService"
      method: "PlaceOrderAsync"
      timing: "after_transaction_commit"
      note: "Order is committed to DB before this fires. Rollback is not possible at this point."

payload:
  class: "OrderPlacedEvent"
  fields:
    - name: "Order"
      type: "Nop.Core.Domain.Orders.Order"
      nullable: false
      description: "The newly placed order. All fields populated including Id, CustomerId, StoreId, OrderItems."
      mutability: "READ_ONLY"
      note: "Handlers MUST NOT modify this object. Publisher reads Order after Publish returns."

payload_guarantees:
  - "Order.Id is assigned (auto-increment PK) before event fires"
  - "Order.OrderItems is populated (all items in the order)"
  - "Order.PaymentStatus == Paid (payment confirmed before PlaceOrderAsync is called)"
  - "Order.OrderStatus == Processing at event fire time"
  - "Order.StoreId >= 1 (never 0 — valid order always has store association)"
  - "Product.StockQuantity may already be decremented by IOrderService's SERIALIZABLE transaction"

handler_contract:
  return_type: "void"
  async_allowed: false
  exception_handling: "required_internal_catch"
  exception_propagation: "never_rethrow"
  side_effects_allowed:
    - "INSERT to any SQL table"
    - "Enqueue to IBackgroundTaskQueue"
    - "Enqueue to IQueuedEmailService"
    - "INSERT to ErpSyncQueue or similar outbox tables"
  side_effects_prohibited:
    - "UPDATE Order table (use IOrderService.UpdateOrderAsync if needed, in a separate request)"
    - "UPDATE Order.OrderStatus (violates publisher payload guarantee)"
    - "DELETE any Order or OrderItem record"
    - "Call external HTTP API synchronously (causes thread pool starvation — LAW-3)"
    - "Call another plugin's service directly (use IEventPublisher for cross-plugin communication)"
  timing_budget_ms: 100
  timing_note: >
    Each handler contributes to total checkout latency. Budget is 100ms per handler.
    Handlers exceeding 100ms MUST enqueue slow work to IBackgroundTaskQueue.

execution_order:
  mechanism: "Autofac DI registration order = plugin folder alphabetical order"
  override_attribute: "EventHandlerOrderAttribute(int priority)"
  governance: "ADR-001"
  current_consumers:
    - plugin: "Nop.Plugin.A_EmailQueue"
      class: "EmailQueueOrderPlacedConsumer"
      priority: 100
      action: "INSERT QueuedEmail (order confirmation)"
      folder_prefix: "A_"
    - plugin: "Nop.Plugin.Catalog.Inventory"
      class: "InventoryOrderPlacedConsumer"
      priority: 500
      action: "UPDATE Product.StockQuantity (optimistic concurrency retry — LAW-6)"
      folder_prefix: null
    - plugin: "Nop.Plugin.Z_ERPIntegration"
      class: "ERPOrderPlacedConsumer"
      priority: 900
      action: "INSERT ErpSyncQueue { Status=Pending }"
      folder_prefix: "Z_"

storeid_semantics:
  event_payload: "Order.StoreId >= 1 always — valid orders never have StoreId=0"
  handler_note: "If handler reads settings: use Order.StoreId (not 0) for store-specific config"

concurrency_notes:
  - "Product.StockQuantity may be written by both IOrderService and InventoryPlugin concurrently"
  - "InventoryPlugin handler uses optimistic concurrency (RowVersion) + retry (max 3) — LAW-6"
  - "ERPPlugin handler assumes EmailQueue and Inventory have completed (ordering dependency via ADR-001)"

error_handling:
  publisher_behavior: "Swallows unhandled exceptions from all handlers — no re-throw, no log"
  required_in_handler: "try/catch wrapping entire HandleEvent body + ILogger.LogError on catch"
  silent_failure_risk: "HIGH — missing try/catch = invisible failures in production"

idempotency:
  required: true
  reason: >
    In gateway timeout scenarios, IOrderService.PlaceOrderAsync may be retried.
    OrderPlacedEvent may fire more than once for the same OrderId.
    All handlers MUST be idempotent: repeated execution must not cause duplicate side effects.
  implementation_pattern: |
    // Check before acting
    var alreadyProcessed = await _myTable.AnyAsync(r => r.OrderId == order.Id);
    if (alreadyProcessed)
    {
        _logger.LogInformation("Order {OrderId} already processed — skipping", order.Id);
        return;
    }

new_consumer_checklist:
  - "Handler return type is void (not async Task)"
  - "Entire body in try/catch with ILogger.LogError"
  - "No .Wait() or .GetAwaiter().GetResult() in handler body"
  - "Slow work enqueued to IBackgroundTaskQueue"
  - "EventHandlerOrder attribute applied with correct priority (ADR-001)"
  - "Plugin folder prefix matches priority range (A_=100-499, Z_=900-999)"
  - "Handler is idempotent (safe to call twice for same OrderId)"
  - "Handler does not modify eventMessage.Order"
  - "This spec updated with new consumer entry in current_consumers list"
  - "PR reviewed by @arch-lead before merge"

related_events:
  - "OrderPaidEvent — published when payment confirmed asynchronously (e.g., 3DS webhook)"
  - "OrderRefundedEvent — published after refund; InventoryPlugin restores stock"
  - "OrderCancelledEvent — published on admin cancel; InventoryPlugin restores stock"

related_specs:
  - "/specs/order-refunded-event.yaml"
  - "/specs/order-paid-event.yaml"

related_docs:
  - "/docs/architecture/sequence-plugin-events.md"
  - "/docs/architecture/sequence-checkout.md"
  - "/docs/adr/ADR-001-event-handler-ordering.md"
  - "/skills/plugin-event-consumer.md"
```

---

## How to Add a New Consumer

1. Read this spec and `/skills/plugin-event-consumer.md` before writing any code
2. Implement `IConsumer<OrderPlacedEvent>` using the compliant template in the skill file
3. Apply `[EventHandlerOrder(N)]` with the correct priority for your ordering requirement
4. Verify your handler is idempotent (safe to call twice for the same OrderId)
5. Add your consumer to the `current_consumers` list in this spec
6. Submit PR — CI gate will verify:
   - Return type is `void`
   - `try/catch` present
   - `[EventHandlerOrder]` attribute present
   - Consumer added to this spec's `current_consumers`
7. Get @arch-lead review (required for all new event consumers)

---

## SpecKit CI Gate Behavior for This Spec

```
Hard fail (blocks merge):
  - New class implements IConsumer<OrderPlacedEvent> but is NOT in current_consumers list
  - Handler method signature is async Task (not void)

Warning (5 business days to fix):
  - Handler in current_consumers but spec version not bumped (drift detected)
  - Priority in [EventHandlerOrder] does not match priority in this spec

Info (logged, monthly Ops review):
  - New consumer added without timing_budget_ms measurement
  - Consumer lacks idempotency comment block
```
