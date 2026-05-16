# Sequence Diagram — Order Refund Flow (with Stock Restore)

**Target path in repo**: `/docs/architecture/sequence-refund.md`  
**Verified**: 2026-05-16 by @senior-dev-1 (against payment gateway sandbox + staging trace captures)  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Covers**: Full refund path — partial and full refund, payment gateway void/refund, stock restore, ERP notification, idempotency

---

## Full Refund Sequence

```mermaid
sequenceDiagram
  autonumber
  participant Admin as Store Admin (Browser)
  participant Web as Admin Panel (ASP.NET Core)
  participant OS as IOrderService
  participant Pay as IPaymentService
  participant GW as Payment Gateway (Stripe)
  participant EP as IEventPublisher
  participant Email as Email Queue (QueuedEmail)
  participant Inv as InventoryPlugin Consumer
  participant ERP as ERPSyncPlugin Consumer
  participant DB as SQL Server
  participant Cache as Redis Cache

  Admin->>Web: POST /admin/order/refund { orderId=42, amount=49.99, reason }

  Web->>DB: SELECT Order WHERE Id=42 (with OrderItems, PaymentStatus, TransactionId)
  DB-->>Web: Order { Status=Processing, PaymentStatus=Paid, TransactionId=ch_xxx, OrderTotal=199.99 }

  alt Order not in refundable state (Cancelled, Deleted, Pending)
    Web-->>Admin: 400 + "Order is not in a refundable state"
    Note over Web: Guard: only Processing or Complete orders are refundable
  end

  Note over Web: Determine refund type: Full (amount=OrderTotal) vs Partial

  alt Full refund (amount == OrderTotal)
    Web->>Pay: Refund(transactionId=ch_xxx, amount=199.99, idempotencyKey=refund-{orderId}-full)
    Pay->>GW: POST /v1/refunds { charge=ch_xxx, amount=19999, idempotency_key=refund-42-full }

    alt Gateway timeout (>5s)
      GW-->>Pay: connection timeout
      Pay-->>Web: RefundResult { Success=false, Error=GatewayTimeout, IdempotencyKey=refund-42-full }
      Web->>DB: INSERT OrderNote { Note="Refund initiated, pending gateway confirmation", IsCustomerNotified=false }
      Web-->>Admin: 200 + "Refund pending — gateway timed out, manual verification required"
      Note over Web: Finance team must verify in Stripe dashboard. LAW: idempotency key prevents double-refund on retry.

    else Gateway error (4xx/5xx)
      GW-->>Pay: HTTP error { code=charge_already_refunded }
      Pay-->>Web: RefundResult { Success=false, Error=AlreadyRefunded, TransactionId=re_existing }
      Web->>DB: SELECT OrderRefund WHERE OrderId=42 AND TransactionId=re_existing
      DB-->>Web: OrderRefund (existing record)
      Web-->>Admin: 200 + "Order already refunded on {date}" (idempotent, no duplicate)

    else Refund success
      GW-->>Pay: { id=re_xxx, status=succeeded, amount=19999 }
      Pay-->>Web: RefundResult { Success=true, RefundId=re_xxx, Amount=199.99 }

      Web->>OS: RefundOrder(orderId=42, refundId=re_xxx, amount=199.99, isPartial=false)
      OS->>DB: BEGIN TRANSACTION
      OS->>DB: UPDATE Order SET PaymentStatus=Refunded, OrderStatus=Cancelled WHERE Id=42
      OS->>DB: INSERT OrderRefund { OrderId=42, RefundId=re_xxx, Amount=199.99, CreatedOn=NOW }
      OS->>DB: INSERT OrderNote { Note="Order refunded. RefundId=re_xxx. Amount=199.99", IsCustomerNotified=false }
      OS->>DB: COMMIT TRANSACTION

      OS->>EP: PublishEvent(new OrderRefundedEvent(order, refundAmount=199.99, isPartial=false))
      Note over EP: Handlers execute synchronously — alpha order. LAW-3: no async/await.

      EP->>Email: IConsumer<OrderRefundedEvent>.HandleEvent → INSERT QueuedEmail (refund confirmation to customer)
      Email->>DB: INSERT QueuedEmail { To=customer.Email, Subject="Your refund has been processed", Priority=5 }

      EP->>Inv: IConsumer<OrderRefundedEvent>.HandleEvent → Restore stock for all order items
      loop For each OrderItem where Product.ManageStock=true
        Inv->>DB: SELECT Product WHERE Id=X (load current RowVersion)
        DB-->>Inv: Product { StockQuantity=currentQty, RowVersion=v }
        Inv->>DB: UPDATE Product SET StockQuantity=currentQty+{orderedQty} WHERE Id=X AND RowVersion=v
        alt Concurrency conflict
          DB-->>Inv: DbUpdateConcurrencyException
          Inv->>DB: SELECT Product WHERE Id=X (reload)
          Inv->>DB: UPDATE Product SET StockQuantity=reloaded+{orderedQty} WHERE Id=X AND RowVersion=newV
        else Success
          DB-->>Inv: 1 row affected
        end
        Note over Inv: Stock restore must be idempotent. Duplicate refund event = double stock restore. Guard: check OrderRefund table before restoring.
      end

      EP->>ERP: IConsumer<OrderRefundedEvent>.HandleEvent → INSERT ErpSyncQueue { OrderId=42, EventType=Refunded, Status=Pending }
      ERP->>DB: INSERT ErpSyncQueue record

      OS-->>Web: RefundResult { Success=true }
      Web->>Cache: DEL nop.product.stockqty.{productId} (for each refunded product)
      Web-->>Admin: 302 → /admin/order/details/42 (refund complete banner)
    end

  else Partial refund (amount < OrderTotal)
    Web->>Pay: Refund(transactionId=ch_xxx, amount=49.99, idempotencyKey=refund-{orderId}-{timestamp})
    Pay->>GW: POST /v1/refunds { charge=ch_xxx, amount=4999, idempotency_key=refund-42-{ts} }
    GW-->>Pay: { id=re_yyy, status=succeeded, amount=4999 }
    Pay-->>Web: RefundResult { Success=true, RefundId=re_yyy, Amount=49.99 }

    Web->>OS: RefundOrder(orderId=42, refundId=re_yyy, amount=49.99, isPartial=true)
    OS->>DB: BEGIN TRANSACTION
    OS->>DB: UPDATE Order SET PaymentStatus=PartiallyRefunded WHERE Id=42
    Note over OS: OrderStatus stays as-is (Processing or Complete) on partial refund
    OS->>DB: INSERT OrderRefund { OrderId=42, RefundId=re_yyy, Amount=49.99, IsPartial=true, CreatedOn=NOW }
    OS->>DB: INSERT OrderNote { Note="Partial refund issued. Amount=49.99. RefundId=re_yyy" }
    OS->>DB: COMMIT TRANSACTION

    OS->>EP: PublishEvent(new OrderRefundedEvent(order, refundAmount=49.99, isPartial=true))
    Note over EP: isPartial=true — InventoryPlugin must NOT restore stock on partial refund.\nStock is only restored on full refund or explicit item return.
    EP->>Email: IConsumer<OrderRefundedEvent>.HandleEvent → INSERT QueuedEmail (partial refund notification)
    EP->>ERP: IConsumer<OrderRefundedEvent>.HandleEvent → INSERT ErpSyncQueue { EventType=PartialRefund }
    Note over Inv: InventoryPlugin checks eventMessage.IsPartial — if true, skips stock restore.

    OS-->>Web: RefundResult { Success=true }
    Web-->>Admin: 302 → /admin/order/details/42 (partial refund banner)
  end
```

---

## Refund State Machine

```mermaid
stateDiagram-v2
  [*] --> Processing : PlaceOrder success
  Processing --> Complete : Manual admin action or fulfilment
  Complete --> [*]

  Processing --> Cancelled : Full refund
  Complete --> Cancelled : Full refund (post-ship return)

  Processing --> Processing : Partial refund (PaymentStatus=PartiallyRefunded)
  Complete --> Complete : Partial refund

  note right of Cancelled
    OrderStatus=Cancelled
    PaymentStatus=Refunded
    Stock restored (all items)
    ERP notified
  end note

  note right of Processing
    OrderStatus=Processing
    PaymentStatus=PartiallyRefunded
    Stock NOT restored
    ERP notified (PartialRefund event)
  end note
```

---

## Idempotency Rules

| Scenario | Idempotency Key Pattern | Guard |
|---|---|---|
| Full refund | `refund-{orderId}-full` | Stripe rejects duplicate, nop checks `OrderRefund` table |
| Partial refund | `refund-{orderId}-{unixTimestamp}` | Admin must not re-submit — no auto-retry |
| Gateway timeout retry | Same key as original attempt | Stripe returns existing refund, nop checks `OrderRefund` |
| Already-refunded response | N/A — Stripe returns existing refund ID | Look up `OrderRefund WHERE TransactionId=re_existing`, surface to admin |

---

## Stock Restore Rules (InventoryPlugin)

```
IF OrderRefundedEvent.IsPartial == true
    → Skip stock restore (partial refunds do not return items)
IF OrderRefundedEvent.IsPartial == false
    → Restore StockQuantity for all OrderItems where Product.ManageStock == true
    → Use optimistic concurrency (RowVersion) with retry (max 3)
    → Guard: SELECT OrderRefund WHERE OrderId=X AND EventType=Refunded before restoring
      If record exists AND stock already restored → skip (idempotency for duplicate events)
```

---

## Known Incident History (refund flow)

| Incident | Root Cause | Resolution |
|---|---|---|
| 2025-Q1: Double stock restore | InventoryPlugin lacked idempotency guard — admin re-clicked refund on timeout | Check `OrderRefund` table before restoring; idempotency key on Stripe call |
| 2025-Q3: Partial refund restored stock | InventoryPlugin did not check `IsPartial` flag | Added `if (eventMessage.IsPartial) return;` guard in InventoryPlugin |
| 2024-Q4: ERP showed wrong refund amount | ERP consumer read `Order.OrderTotal` instead of `OrderRefundedEvent.RefundAmount` | Consumer now uses event payload, not reloaded order |
