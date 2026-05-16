---
phase: P0
title: "Diagram Literacy"
weeks: "1–2"
session_id: "debate-p0-nopcommerce-20260516"
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
  - "Start with Claude Code discovery run before drawing anything"
  - "Mermaid only — no PlantUML, no Structurizr Phase 0"
  - "C4 Context + 3 critical sequence diagrams (checkout, refund, plugin-event-cascade)"
  - "DRAFT label until senior engineer verifies against production runtime"
  - "FRESHNESS.md tracks 90-day re-verification cycles"
---

# Phase 0: Diagram Literacy — Agent Debate Transcript

**Session**: 2026-05-16T09:00:00Z  
**Codebase**: nopCommerce 4.70 (ASP.NET Core 8, ~200 plugins, SQL Server 2019, Redis 6)  
**Team context**: 5 engineers, 8-year codebase tenure, zero living diagrams, Confluence wiki last updated 2021

---

## Pre-Session Brief

The team has operated nopCommerce for 8 years with all architecture knowledge locked in three senior engineers' heads and a stale Confluence wiki. The goal of Phase 0 is not to produce pretty diagrams — it is to establish a **diagram infrastructure that Claude can read, generate, and keep current** through all subsequent phases.

Stakes: every Phase 1–4 artifact — skills, specs, agents, CI gates — depends on the diagram layer being accurate. A wrong diagram committed as authoritative is worse than no diagram.

---

## Turn 1 — OPUS-ARCH [Opening Position]

The non-negotiable invariant for Phase 0: **every diagram must be version-controlled, co-located with source, and renderable without human intervention in CI**.

This eliminates immediately: Lucidchart (external, not version-controlled), Confluence diagrams (not co-located with code), draw.io XML (version-controllable but diffs are unreadable binary-ish XML). The only viable candidates are **Mermaid** and **PlantUML with C4 library**.

My position: Mermaid only. Reasons:
- GitHub renders Mermaid natively in `.md` files — zero tooling required for review
- VS Code + JetBrains render Mermaid inline — developers see diagrams as they write
- Claude generates Mermaid with high accuracy across C4, sequence, ER, flowchart
- CI validation via `@mermaid-js/mermaid-cli` is npm-installable — no Java runtime dependency

On sequencing: **C4 Context first**. You cannot reason about nopCommerce internals until the team has agreed on what nopCommerce IS to the outside world. The C4 Context exercise forces consensus on: which external systems exist, what we call them, and what the system boundary is. In an 8-year-old codebase, that terminology consensus alone resolves 20–30% of the design-review friction I observe in similar teams.

Week 1 deliverable: C4 Context diagram committed to `/docs/architecture/context.md`.

---

## Turn 2 — SONNET-RUN [Pragmatic Challenge]

I agree on Mermaid. I disagree on C4 Context first.

The team has operated this system for 8 years — they know what nopCommerce is to the outside world. What they do NOT know is why certain plugin interactions produce the behavior they produce. The dangerous tribal knowledge is internal, not external.

Specifically, three areas where undocumented internal behavior causes incidents:

1. **Plugin event cascade ordering** — `IConsumer<T>` handlers on `OrderPlacedEvent` execute in DI registration order, which is plugin-load order, which is alphabetical by plugin folder name. Nobody has documented this. Three plugins assume they run before each other.

2. **Settings read timing** — `ISettingService.GetSettingByKey` before `IStoreContext.CurrentStore` is initialized returns null silently. Two plugins have initialization bugs hidden behind this.

3. **Cache invalidation scope** — `IStaticCacheManager.RemoveByPrefix` only removes from the current node's in-memory cache in single-server setups, but in multi-server setups hits Redis. The behavior changes without a code change.

I propose: **sequence diagrams for the 3 most incident-prone flows as Week 1**. The C4 Context is a 20-minute Claude Code task — prompt it with all plugin descriptors and it generates 90% accurate context automatically. That is Week 1.5 work, not a 2-hour workshop.

---

## Turn 3 — HAIKU-OPS [Stability Concern]

Both positions assume we know what the system does. We don't — not precisely.

In the last 6 months of ops I have logged 4 production incidents where actual runtime behavior diverged from what we believed the code did. In 2 of those cases, the bugs had been present for over a year, invisible because nobody had diagrammed the interaction path.

If we diagram from our mental model, we will produce authoritative-looking diagrams of a system that does not match production. Claude will then use those wrong diagrams as ground truth in Phase 2 skill generation and Phase 3 agent planning. The error compounds.

**Before any diagram is committed, we need a discovery sprint:**

```
Claude Code prompt (run against /src):
"Identify every:
  1. External HTTP call (HttpClient, RestSharp, HttpWebRequest)
  2. Database connection string usage outside of Nop.Data
  3. Redis operation outside of IStaticCacheManager
  4. File system write outside of IPictureService and IDownloadService
  5. Plugin that calls another plugin's service directly (bypassing IEventPublisher)
Output as: plugin-name | interaction-type | target | documented(yes/no)"
```

This gives ground-truth discovery. We then diagram from evidence, not assumption.

Risk of skipping: we commit wrong diagrams, they become the AI's prior, every Phase 2–4 output inherits the error.

---

## Turn 4 — OPUS-ARCH [Rebuttal + Synthesis]

HAIKU-OPS is correct. I concede the discovery sprint must precede diagram commitment.

However, the discovery sprint and diagram generation can happen in the same work session. The workflow:

```
Day 1 (4 hrs):
  1. [2 hrs] Claude Code discovery run → plugin-interaction-report.md
  2. [1 hr] Claude generates C4 Context from report → context-DRAFT.md
  3. [1 hr] Claude generates sequence diagrams from report → sequences-DRAFT.md

Day 2 (2 hrs):
  4. [1 hr] Team review session — verify against staging behavior
  5. [1 hr] Remove DRAFT label from verified sections, commit to /docs/architecture/
```

The DRAFT label is the critical safety mechanism. We never claim a diagram is authoritative until a senior engineer has verified it against actual runtime behavior. This satisfies all three positions.

On sequencing: I withdraw C4 Context as the sequencing priority. The discovery report determines which diagrams are most urgent. If HAIKU-OPS's report reveals the plugin event cascade is the highest-complexity undocumented area, we diagram that first.

---

## Turn 5 — SONNET-RUN [Acceptance + Refinement]

Agreed on the workflow. Three additions:

**1. Error paths are mandatory.** The checkout sequence diagram is useless if it only shows the happy path. The value is in showing: what happens when PaymentGateway returns timeout? What happens when Redis cache miss occurs during discount calculation? These are the paths that cause incidents, and they're exactly what won't be in the Confluence wiki.

**2. Undocumented external calls must appear in C4 Context.** HAIKU-OPS's discovery prompt specifically asks about external HTTP calls. Any that the team didn't know about go into the C4 Context as external systems labeled `[UNDOCUMENTED]`. This is a forcing function to document or remove them.

**3. AI-generate sequence diagrams from code, not from memory.** Prompt Claude with: "Read the `PlaceOrderAsync` method in `OrderProcessingService.cs` and all `IConsumer<OrderPlacedEvent>` implementations. Generate a sequence diagram showing the full execution flow including async handlers." This produces diagrams from code, not from what someone remembers the code does.

---

## Turn 6 — HAIKU-OPS [Risk Sign-off]

Accepted. One operational addition: `/docs/architecture/FRESHNESS.md` must be committed on Day 2 alongside the diagrams.

**Policy**: Any diagram not re-verified within 90 days of a production deployment that touched the described subsystem is automatically marked STALE in CI via a date-check script. STALE diagrams generate a PR warning (not a failure) on any PR touching the same subsystem.

This prevents the Confluence problem: authoritative-looking content that silently ages into misinformation.

---

## Resolution

**Agreed approach (all three agents sign off):**

1. **Day 1 morning**: Claude Code discovery run → `plugin-interaction-report.md`
2. **Day 1 afternoon**: Claude generates C4 Context + C4 Container + 3 sequence diagrams from report
3. **Day 2**: Team review (1hr) → remove DRAFT from verified diagrams → commit
4. **Commit alongside**: `FRESHNESS.md` with verification tracking
5. **Tooling**: Mermaid only, `/docs/architecture/` directory, `.md` files with fenced Mermaid blocks
6. **Mandatory**: Error paths in all sequence diagrams; undocumented external calls labeled in C4 Context

---

## Artifacts Produced

### Artifact 1 — C4 Context Diagram

```mermaid
C4Context
  title System Context — nopCommerce E-Commerce Platform

  Person(customer, "Customer", "Browses catalog, places orders, tracks shipments, manages account and wishlist")
  Person(admin, "Store Administrator", "Manages products, categories, orders, promotions, tax rules, localization, plugin settings")
  Person(pluginDev, "Plugin Developer", "Builds custom plugins extending catalog, payments, shipping, widgets, and task scheduling")

  System(nop, "nopCommerce Platform", "ASP.NET Core 8 multi-store e-commerce system. Plugin-based via IPlugin interface. ~200 plugins. Razor Pages storefront + admin panel.")

  System_Ext(payGateway, "Payment Gateway", "Stripe / PayPal / Authorize.Net. Processes card-present and card-not-present transactions. PCI-DSS boundary.")
  System_Ext(emailSvc, "Email Service", "SendGrid / SMTP relay. Transactional email: order confirmations, shipment notifications, password resets, marketing campaigns.")
  System_Ext(cdn, "CDN", "Azure CDN / AWS CloudFront. Serves product images, theme CSS/JS, plugin-contributed static assets.")
  System_Ext(searchEngine, "Search Engine", "Elasticsearch / Algolia / Azure Search. Receives product index updates. Serves search and autocomplete queries.")
  System_Ext(erp, "ERP / WMS", "SAP / custom WMS. Inventory levels, purchase orders, fulfillment status. Sync via custom integration plugin. [PARTIALLY DOCUMENTED]")
  System_Ext(taxSvc, "Tax Service", "Avalara / TaxJar. Real-time tax calculation at checkout. [UNDOCUMENTED — found in discovery run]")
  System_Ext(shipSvc, "Shipping Rate API", "FedEx / UPS / USPS rate APIs. Real-time shipping estimates. Plugin-managed credentials.")
  System_Ext(claude, "Claude AI (Anthropic API)", "Code generation, documentation authoring, spec validation, architecture review. Accessed via Claude Code CLI and MCP servers.")
  System_Ext(monitoring, "Monitoring Stack", "Application Insights + custom Datadog dashboard. Traces, exceptions, performance counters, custom business metrics.")
  System_Ext(sso, "SSO Provider", "Azure AD / Okta. Admin authentication. Customer SSO via OpenID Connect plugin. [UNDOCUMENTED — found in discovery run]")

  Rel(customer, nop, "Shops, places orders", "HTTPS/443")
  Rel(admin, nop, "Administers store", "HTTPS/443")
  Rel(pluginDev, nop, "Deploys plugins", ".NET assembly + plugin descriptor")
  Rel(nop, payGateway, "Processes payments and refunds", "HTTPS REST")
  Rel(nop, emailSvc, "Sends transactional and marketing email", "SMTP / REST API")
  Rel(nop, cdn, "Serves static assets via", "HTTPS")
  Rel(nop, searchEngine, "Indexes products, queries results", "HTTPS REST")
  Rel(nop, erp, "Syncs inventory, pushes orders", "HTTPS webhooks")
  Rel(nop, taxSvc, "Calculates tax at checkout", "HTTPS REST")
  Rel(nop, shipSvc, "Fetches real-time rates", "HTTPS REST")
  Rel(nop, monitoring, "Emits telemetry", "OTLP / SDK")
  Rel(nop, sso, "Authenticates admin users", "OIDC / SAML")
  Rel(claude, nop, "Reads codebase, generates code and docs", "Claude Code CLI + MCP")
```

### Artifact 2 — C4 Container Diagram

```mermaid
C4Container
  title Container Diagram — nopCommerce Internal Architecture

  Person(customer, "Customer")
  Person(admin, "Store Admin")

  System_Boundary(nopBoundary, "nopCommerce Platform") {
    Container(webApp, "Storefront + Admin Panel", "ASP.NET Core 8 MVC + Razor Pages", "Handles all HTTP requests. Loads plugin controllers and views dynamically. Multi-store routing. Theming engine.")
    Container(pluginEngine, "Plugin Engine", "Nop.Core + Nop.Web.Framework", "IPlugin discovery via /Plugins/ folder scan. PluginDescriptor validation. Autofac DI registration per plugin. IWidgetPlugin zone injection.")
    Container(domainServices, "Domain Services", "Nop.Services assemblies (24 service namespaces)", "IProductService, IOrderService, ICustomerService, IDiscountService, IShippingService, etc. Business logic. All cache-aware via ICacheManager.")
    Container(dataLayer, "Data Access Layer", "Nop.Data + Entity Framework Core 8", "IRepository<T> generic pattern. SQL Server provider. Code-first migrations. Nop_* table prefix. Multi-store via StoreId column.")
    Container(bgScheduler, "Background Task Scheduler", "Nop.Services.Tasks + Hangfire", "IScheduleTask implementations. Product index rebuild, email queue processing, sitemap generation, currency rate sync, database log cleanup.")
    Container(cacheLayer, "Distributed Cache", "Redis 6 (IStaticCacheManager) + In-memory fallback", "Cache-aside pattern. CacheKey with prefix+version. ILocker for distributed locking. Per-store cache isolation via StoreId prefix.")
    Container(db, "SQL Server 2019", "Relational Database", "Single database. Multi-tenant via StoreId. ~180 tables with Nop_ prefix. Full-text search index on product name/description. Encrypted column for payment tokens.")
    Container(fileStorage, "File Storage", "Azure Blob Storage / Local Disk", "IPictureService: product images, category thumbnails. IDownloadService: downloadable products. Plugin asset uploads. PDF invoice storage.")
    Container(pluginSettings, "Plugin Settings Store", "SQL Server (Setting table) + Redis cache", "ISettingService. Key-value pairs per plugin per store. Cached on first read. Invalidated on admin save. Multi-store override via StoreId=0 (global) vs StoreId=N (specific).")
  }

  Rel(customer, webApp, "HTTP requests", "HTTPS 443")
  Rel(admin, webApp, "HTTP requests", "HTTPS 443")
  Rel(webApp, pluginEngine, "Plugin controller routing, widget rendering")
  Rel(webApp, domainServices, "Direct service calls for core pages")
  Rel(pluginEngine, domainServices, "Plugin services consume domain services")
  Rel(domainServices, dataLayer, "Repository reads/writes")
  Rel(domainServices, cacheLayer, "Cache-aside reads/writes", "Redis protocol")
  Rel(domainServices, pluginSettings, "Reads plugin configuration")
  Rel(dataLayer, db, "SQL queries", "TCP 1433")
  Rel(bgScheduler, domainServices, "Scheduled invocations")
  Rel(domainServices, fileStorage, "Binary asset storage")
  Rel(cacheLayer, db, "Cache miss fallthrough")
```

### Artifact 3 — Sequence Diagram: Checkout Flow (with error paths)

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer Browser
  participant Web as Storefront (ASP.NET Core)
  participant CS as IShoppingCartService
  participant DS as IDiscountService
  participant TS as ITaxService
  participant PS as IPaymentService
  participant GW as Payment Gateway
  participant OS as IOrderService
  participant EP as IEventPublisher
  participant Cache as Redis Cache
  participant DB as SQL Server
  participant EQ as Email Queue

  C->>Web: POST /checkout/confirm (cartId, paymentToken)
  Web->>Cache: GET cart:{customerId}:{storeId}
  alt Cache miss
    Cache-->>Web: null
    Web->>DB: SELECT cart items WHERE CustomerId=X AND StoreId=Y
    DB-->>Web: CartItem[]
    Web->>Cache: SET cart:{customerId}:{storeId} TTL=5min
  else Cache hit
    Cache-->>Web: CartItem[] (serialized)
  end

  Web->>DS: ApplyDiscounts(cart, customerId, couponCode)
  DS->>Cache: GET discounts:{couponCode}
  alt Discount cache miss
    DS->>DB: SELECT discount rules WHERE CouponCode=X AND IsActive=1
    DB-->>DS: Discount[]
    DS->>Cache: SET discounts:{couponCode} TTL=60min
  end
  DS-->>Web: CartWithDiscounts

  Web->>TS: GetTaxTotal(cart, shippingAddress)
  Note over TS: Calls external Tax Service (Avalara) — network boundary
  TS->>GW: POST /api/tax/calculate (async, 2s timeout)
  alt Tax service timeout
    GW-->>TS: timeout after 2000ms
    TS-->>Web: TaxResult { FallbackRate=true, TaxAmount=estimatedTax }
    Note over Web: Proceeds with estimated tax, flags order for manual review
  else Tax service success
    GW-->>TS: TaxResult { Calculated=true, TaxAmount=exactTax }
    TS-->>Web: TaxResult { FallbackRate=false }
  end

  Web->>PS: ProcessPayment(paymentToken, amount, currency)
  PS->>GW: POST /v1/charges (paymentToken, amount, idempotencyKey)
  alt Gateway timeout (>5s)
    GW-->>PS: connection timeout
    PS-->>Web: PaymentResult { Success=false, Error=GatewayTimeout, IdempotencyKey=X }
    Web->>DB: INSERT Order { Status=PendingPayment, IdempotencyKey=X }
    Web-->>C: 200 + /checkout/pending?orderId=42 (retry scheduled in 5min)
  else Card declined
    GW-->>PS: { status=declined, code=insufficient_funds }
    PS-->>Web: PaymentResult { Success=false, Error=CardDeclined, DeclineCode=X }
    Web-->>C: 200 + /checkout/payment (decline message shown)
  else Duplicate charge detected (idempotency)
    GW-->>PS: { status=succeeded, existing=true, chargeId=ch_existing }
    PS-->>Web: PaymentResult { Success=true, TransactionId=ch_existing, Duplicate=true }
    Note over Web: Idempotent — find existing order and redirect
    Web->>DB: SELECT Order WHERE IdempotencyKey=X
    Web-->>C: 302 → /checkout/completed/{existingOrderId}
  else Payment success
    GW-->>PS: { status=succeeded, chargeId=ch_xxx }
    PS-->>Web: PaymentResult { Success=true, TransactionId=ch_xxx }
    Web->>OS: PlaceOrderAsync(cart, paymentResult, shippingAddress)
    OS->>DB: BEGIN TRANSACTION
    OS->>DB: INSERT Order (Status=Processing, TransactionId=ch_xxx)
    OS->>DB: INSERT OrderItems (productId, qty, unitPrice, discountAmount)
    OS->>DB: INSERT OrderNote (isCustomerNotified=false)
    OS->>DB: UPDATE Product.StockQuantity WHERE ManageStock=true
    OS->>DB: COMMIT TRANSACTION
    OS->>EP: PublishEvent(new OrderPlacedEvent(order))
    Note over EP: Async fan-out to all IConsumer<OrderPlacedEvent> handlers
    par Plugin event handlers (DI registration order = plugin folder alpha order)
      EP->>EQ: Enqueue confirmation email (EmailQueuePlugin)
      EQ-->>EP: queued
    and
      EP->>DB: UPDATE StockQuantity (InventoryPlugin — may conflict with OS above)
      Note over DB: Race condition risk if InventoryPlugin and OS both write stock
    and
      EP->>DB: INSERT ErpSyncQueue record (ERP integration plugin)
    end
    OS-->>Web: Order { Id=42, Status=Processing, OrderTotal=199.99 }
    Web->>Cache: DEL cart:{customerId}:{storeId}
    Web->>Cache: DEL product:stockqty:* (invalidate product cache range)
    Web-->>C: 302 → /checkout/completed/42
  end
```

### Artifact 4 — ADR-000: Diagram Tooling Decision

```markdown
# ADR-000: Diagram-as-Code Tooling for nopCommerce AI Adoption

**Date**: 2026-05-16  
**Status**: Accepted  
**Deciders**: Engineering team + AI architecture session (OPUS-ARCH, SONNET-RUN, HAIKU-OPS)

## Context

We have zero living diagrams for an 8-year-old codebase. We must select diagram tooling that:
- Claude can generate reliably
- Developers can read in PRs as text diffs
- Renders without external services in CI
- Scales to C4 levels 1–3 without tooling change

## Decision

Use **Mermaid** exclusively for all diagrams in Phase 0 and Phase 1. Revisit Structurizr DSL at Phase 4 if C4 model complexity exceeds Mermaid's expressiveness.

## Rationale

| Criterion | Mermaid | PlantUML | Structurizr DSL |
|---|---|---|---|
| Native GitHub rendering | Yes | No | No |
| Claude generation quality | Excellent | Good | Fair |
| CI dependency | npm only | Java + jar | npm or Java |
| PR diff readability | Excellent | Good | Good |
| C4 support | Good (via C4 notation) | Excellent (C4 library) | Excellent (native) |

Mermaid's C4 support is sufficient for Phase 0–3. PlantUML's superior C4 library does not justify adding a Java runtime to CI.

## Rejected Alternatives

- **PlantUML**: Java CI dependency. Diagrams not renderable in GitHub without plugin.
- **Structurizr DSL**: Best C4 tooling, weakest Claude support. Revisit Phase 4.
- **draw.io**: XML diffs unreadable. Not generatable by Claude reliably.
- **Lucidchart**: External SaaS, not version-controlled.

## Consequences

- All diagrams: `/docs/architecture/` as `.md` files with Mermaid fenced code blocks
- `FRESHNESS.md`: tracks last-verified date per diagram
- CI check: `npx @mermaid-js/mermaid-cli` validates syntax on every PR touching `/docs/`
- Diagrams older than 90 days without re-verification → STALE flag in CI warning
```

### Artifact 5 — FRESHNESS.md

```markdown
# Architecture Diagram Freshness Register

> Policy: Diagrams not re-verified within 90 days of a production deployment
> touching their described subsystem are marked STALE. CI warns on PRs
> touching the same subsystem as a STALE diagram.

| Diagram | File | Describes | Last Verified | Verified By | Status |
|---|---|---|---|---|---|
| C4 Context | context.md | Full system boundary | 2026-05-16 | @arch-lead | ✓ CURRENT |
| C4 Container | container.md | Internal containers | 2026-05-16 | @arch-lead | ✓ CURRENT |
| Checkout Sequence | checkout-flow.md | Order placement | 2026-05-16 | @senior-dev-1 | ✓ CURRENT |
| Refund Sequence | refund-flow.md | Order refund | TBD | TBD | ⚠ DRAFT |
| Event Cascade | plugin-events.md | IEventPublisher flows | TBD | TBD | ⚠ DRAFT |

## Verification Procedure

1. Deploy to staging with latest main branch
2. Execute the user flow described by the diagram (manual or automated test)
3. Compare actual behavior against diagram — note any divergences
4. Update diagram if divergent, then update this table
5. Commit `FRESHNESS.md` update in same PR as diagram update
```

---

## Session Summary

**Total session duration**: ~5 hours (Day 1: 4hrs discovery + generation; Day 2: 1hr review + commit)

**What the discovery run revealed that nobody knew:**
- 2 undocumented external HTTP integrations (Avalara tax service, SSO provider)
- 1 plugin making direct SQL queries bypassing the repository pattern
- Race condition in OrderPlacedEvent handlers (InventoryPlugin + OrderService both write stock)
- Plugin event handler execution order is alphabetical by folder name (undocumented constraint)

**Decisions made**: 5 (Mermaid tooling, discovery-before-diagram, DRAFT labeling, FRESHNESS tracking, error paths mandatory)

**Artifacts committed**: 5 (C4 Context, C4 Container, Checkout Sequence, ADR-000, FRESHNESS.md)

**Gems extracted from this session:**

> *The discovery run is the most valuable artifact. The diagrams are just its rendering.*

> *Two undocumented external integrations found in a codebase with 8 years of institutional knowledge. Every brownfield codebase has secrets the team doesn't know it's keeping.*

> *A diagram committed as authoritative without runtime verification is documentation debt with compounding interest — every AI session that reads it inherits the error.*
