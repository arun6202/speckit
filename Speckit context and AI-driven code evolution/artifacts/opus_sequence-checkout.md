# Sequence Diagram — Checkout Flow (Complete with Error Paths)

**Target path in repo**: `/docs/architecture/sequence-checkout.md`  
**Verified**: 2026-05-16 by @senior-dev-1 (against staging trace captures + payment gateway sandbox logs)  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Covers**: Full checkout — cart validation, discount application, tax calculation, payment processing, order placement, event fan-out, and all documented error paths

---

## Full Checkout Sequence

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer Browser
  participant Web as Storefront (ASP.NET Core)
  participant Cart as IShoppingCartService
  participant Disc as IDiscountService
  participant Tax as ITaxService (+ Avalara)
  participant Pay as IPaymentService
  participant GW as Payment Gateway (Stripe)
  participant OS as IOrderService
  participant EP as IEventPublisher
  participant Email as Email Queue (QueuedEmail)
  participant Inv as InventoryPlugin Consumer
  participant ERP as ERPSyncPlugin Consumer
  participant Cache as Redis Cache
  participant DB as SQL Server

  C->>Web: POST /checkout/one-page (cartId, shippingAddressId, paymentToken)

  %% Step 1: Load and validate cart
  Web->>Cache: GET nop.cart.{customerId}.{storeId}
  alt Cache miss
    Cache-->>Web: null
    Web->>DB: SELECT ShoppingCartItem WHERE CustomerId=X AND StoreId=Y AND ShoppingCartTypeId=1
    DB-->>Web: ShoppingCartItem[]
    Web->>Cache: SET nop.cart.{customerId}.{storeId} TTL=5min
  else Cache hit
    Cache-->>Web: ShoppingCartItem[] (deserialized)
  end

  Web->>Cart: ValidateShoppingCart(items, customer, storeId)
  Cart->>DB: SELECT Product WHERE Id IN (...) — check Published, Deleted, StockQuantity
  DB-->>Cart: Product[] with current stock
  alt Stock insufficient for any item
    Cart-->>Web: ValidationResult { Error="InsufficientStock", ProductId=X }
    Web-->>C: 200 + checkout page (stock error displayed, cart refreshed)
  else All items valid
    Cart-->>Web: ValidationResult { IsValid=true }
  end

  %% Step 2: Apply discounts
  Web->>Disc: GetApplicableDiscounts(cart, customer, couponCode, storeId)
  Note over Disc: Requires loaded Customer object with store affiliation
  Disc->>Cache: GET nop.discounts.{couponCode}.{storeId}
  alt Discount cache miss
    Disc->>DB: SELECT Discount WHERE CouponCode=X AND IsActive=1 AND StartDate<=NOW AND (EndDate IS NULL OR EndDate>=NOW)
    DB-->>Disc: Discount[]
    Disc->>Cache: SET nop.discounts.{couponCode}.{storeId} TTL=60min
  end
  Disc-->>Web: DiscountResult { AppliedDiscounts[], DiscountAmount }

  %% Step 3: Tax calculation via Avalara
  Web->>Tax: GetTaxTotal(cart, shippingAddress, customer)
  Tax->>GW: POST https://rest.avatax.com/api/v2/transactions/create (async, timeout=2000ms)
  alt Avalara timeout (>2s)
    GW-->>Tax: connection timeout
    Tax-->>Web: TaxResult { FallbackRate=true, TaxAmount=estimatedTax, Method="FallbackRate" }
    Note over Web: Proceeds with estimated tax. Order flagged RequiresTaxReview=true.
  else Avalara error (4xx/5xx)
    GW-->>Tax: HTTP error
    Tax-->>Web: TaxResult { FallbackRate=true, TaxAmount=estimatedTax }
    Note over Web: Same fallback. Logged to Application Insights as Warning.
  else Avalara success
    GW-->>Tax: { totalTax, details[] }
    Tax-->>Web: TaxResult { FallbackRate=false, TaxAmount=exactTax, LineDetails[] }
  end

  %% Step 4: Payment processing
  Web->>Pay: ProcessPayment(paymentToken, totalAmount, currency, customerId, orderId=null)
  Pay->>GW: POST /v1/payment_intents/confirm (idempotencyKey=UUID, amount, currency, paymentMethod)
  
  alt Gateway timeout (>5s)
    GW-->>Pay: connection timeout
    Pay-->>Web: PaymentResult { Success=false, Error=GatewayTimeout, IdempotencyKey=UUID }
    Web->>DB: INSERT Order { Status=PendingPayment, IdempotencyKey=UUID, TotalAmount=X }
    Web-->>C: 200 + /checkout/pending?orderId=42 (idempotency key stored for retry)
    Note over Web,DB: Background task retries payment check every 5min for 30min then marks OrderFailed

  else Duplicate charge detected (idempotency hit)
    GW-->>Pay: { status=succeeded, existing=true, paymentIntentId=pi_existing }
    Pay-->>Web: PaymentResult { Success=true, TransactionId=pi_existing, Duplicate=true }
    Web->>DB: SELECT Order WHERE IdempotencyKey=UUID AND CustomerId=X
    Web-->>C: 302 → /checkout/completed/{existingOrderId}

  else Card declined
    GW-->>Pay: { status=requires_payment_method, last_payment_error.code=card_declined }
    Pay-->>Web: PaymentResult { Success=false, Error=CardDeclined, DeclineCode=insufficient_funds }
    Web-->>C: 200 + /checkout/payment (decline message, form pre-filled, new card requested)

  else Authentication required (3DS)
    GW-->>Pay: { status=requires_action, next_action.type=use_stripe_sdk }
    Pay-->>Web: PaymentResult { RequiresAction=true, ClientSecret=pi_xxx_secret_yyy }
    Web-->>C: 200 + 3DS confirmation UI (Stripe.js handles redirect + return)
    Note over C,GW: Customer completes 3DS, Stripe webhooks notify completion

  else Payment success
    GW-->>Pay: { status=succeeded, paymentIntentId=pi_xxx, chargeId=ch_xxx }
    Pay-->>Web: PaymentResult { Success=true, TransactionId=ch_xxx, PaymentIntentId=pi_xxx }

    %% Step 5: Place order
    Web->>OS: PlaceOrderAsync(cart, paymentResult, shippingAddressId, billingAddressId, storeId)
    OS->>DB: BEGIN TRANSACTION (SERIALIZABLE for stock write)
    OS->>DB: INSERT Order { CustomerId, StoreId, OrderStatus=Processing, PaymentStatus=Paid, TransactionId, TotalAmount, TaxAmount, ShippingAmount }
    OS->>DB: INSERT OrderItem (x N items) { ProductId, Qty, UnitPriceInclTax, DiscountAmountInclTax }
    OS->>DB: INSERT OrderNote { IsCustomerNotified=false, Note="Order placed via checkout" }
    OS->>DB: INSERT GiftCardUsage (if applicable)
    OS->>DB: UPDATE Product.StockQuantity WHERE ManageStock=true AND UseMultipleWarehouses=false (optimistic concurrency via RowVersion)
    OS->>DB: COMMIT TRANSACTION
    
    %% Step 6: Event fan-out (synchronous, alpha-ordered by plugin folder)
    OS->>EP: PublishEvent(new OrderPlacedEvent(order))
    Note over EP: Handlers execute synchronously in plugin folder alphabetical order. LAW-3: NO async/await in handlers.
    
    par Plugin event handlers (synchronous, DI registration order)
      EP->>Email: IConsumer<OrderPlacedEvent>.HandleEvent → IQueuedEmailService.InsertQueuedEmail (order confirmation)
      Email->>DB: INSERT QueuedEmail { To=customer.Email, Subject, Body, Priority=5 }
    and
      EP->>Inv: IConsumer<OrderPlacedEvent>.HandleEvent → UPDATE Product.StockQuantity (LAW-6: optimistic concurrency retry)
      Inv->>DB: UPDATE Product SET StockQuantity=StockQuantity-Qty WHERE Id=X AND RowVersion=expected
      alt Concurrency conflict (OrderService already decremented)
        DB-->>Inv: DbUpdateConcurrencyException
        Inv->>DB: SELECT Product.StockQuantity (reread)
        Inv->>DB: UPDATE Product SET StockQuantity=current-Qty WHERE Id=X AND RowVersion=newVersion
      end
    and
      EP->>ERP: IConsumer<OrderPlacedEvent>.HandleEvent → INSERT ErpSyncQueue { OrderId, Status=Pending, CreatedOn }
      ERP->>DB: INSERT ErpSyncQueue record (batch-processed by IScheduleTask every 15min)
    end
    
    OS-->>Web: Order { Id=42, Status=Processing, OrderTotal=199.99 }
    
    %% Step 7: Post-order cleanup
    Web->>Cache: DEL nop.cart.{customerId}.{storeId} (cart invalidation)
    Web->>Cache: RemoveByPrefix("nop.product.stockqty") — targeted keys only, not prefix sweep (LAW-1)
    Web-->>C: 302 → /checkout/completed/42
  end
```

---

## Error Path Summary

| Scenario | Response | Order State | Recovery |
|---|---|---|---|
| Gateway timeout | `/checkout/pending` page | `PendingPayment` + IdempotencyKey stored | Background retry every 5min × 6; then `OrderFailed` |
| Duplicate charge | Redirect to existing order | Order already exists | Idempotency key lookup — no new order |
| Card declined | Checkout page with decline message | No order created | Customer re-enters payment method |
| 3DS required | 3DS UI shown (Stripe.js) | `PendingAuthentication` | Customer completes 3DS; webhook triggers order placement |
| Avalara timeout | Proceed with fallback tax rate | `RequiresTaxReview=true` | Finance team manually reviews within 24h |
| Stock conflict (race) | InventoryPlugin retries optimistic concurrency | Order placed; stock updated after retry | Automatic retry — no user impact |
| Cart cache miss | Reload from DB transparently | No order state yet | Transparent to user — adds latency only |

---

## Critical Constraints in This Flow

**LAW-1 (Cache scope)**: Cart invalidation uses `RemoveAsync(specificKey)`, not `RemoveByPrefixAsync`. Product stock key invalidation targets specific product keys, not a broad prefix sweep.

**LAW-3 (Event handler threading)**: All `IConsumer<OrderPlacedEvent>` handlers are `void HandleEvent(...)` — no `async/await`. Email enqueuing calls `IQueuedEmailService.InsertQueuedEmail()` synchronously (it only inserts to DB, does not send).

**LAW-6 (Stock concurrency)**: Both `IOrderService.PlaceOrder()` and `InventoryPlugin.HandleEvent()` write `Product.StockQuantity`. Optimistic concurrency via `RowVersion` with retry handles the race. The `SERIALIZABLE` transaction in `PlaceOrder` prevents double-sell at the order level; the consumer retry handles post-event consistency.

**Idempotency key**: Generated as `Guid.NewGuid()` per checkout session, stored in user session. On timeout, the key is persisted with the pending order and reused on retry. Stripe's idempotency key prevents double-charging.
