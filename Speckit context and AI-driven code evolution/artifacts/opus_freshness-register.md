# FRESHNESS.md — Architecture Diagram Verification Register

**Target path in repo**: `/docs/architecture/FRESHNESS.md`  
**Owner**: @arch-lead  
**Updated**: 2026-05-16  
**Policy**: All diagrams must be re-verified within 90 days of last verification date. Stale diagrams block PR merges touching the relevant subsystem.

---

## Verification Register

| Diagram | File | Status | Last Verified | Verified By | Next Due | Subsystems Covered |
|---|---|---|---|---|---|---|
| C4 Context | `context.md` | ✅ CURRENT | 2026-05-16 | @arch-lead | 2026-08-16 | All external integrations |
| C4 Container | `container.md` | ✅ CURRENT | 2026-05-16 | @arch-lead | 2026-08-16 | Internal containers, Redis, SQL, Blob |
| Checkout Sequence | `sequence-checkout.md` | ✅ CURRENT | 2026-05-16 | @senior-dev-1 | 2026-08-16 | Cart, Tax, Payment, OrderPlacement |
| Plugin Event System | `sequence-plugin-events.md` | ✅ CURRENT | 2026-05-16 | @arch-lead + @senior-dev-2 | 2026-08-16 | IEventPublisher, all IConsumer<T> handlers |
| Order Refund | `sequence-refund.md` | ✅ CURRENT | 2026-05-16 | @senior-dev-1 | 2026-08-16 | Refund, stock restore, idempotency |
| Plugin Engine Components | `component-plugins.md` | ✅ CURRENT | 2026-05-16 | @arch-lead | 2026-08-16 | Plugin discovery, DI registration, load order |

---

## What Triggers Re-Verification

Re-verification is required (reset the timer) when any of the following occur:

| Trigger | Required Action |
|---|---|
| New external integration added | Update C4 Context + relevant sequence diagrams |
| Plugin added or renamed | Update C4 Container, Plugin Event System sequence, component diagram |
| Payment gateway changed (Stripe → other) | Update checkout sequence, refund sequence, C4 Context |
| Redis topology change (single → cluster) | Update C4 Container, re-verify LAW-1 notes |
| New `IConsumer<T>` handler registered | Update Plugin Event System sequence + event catalogue table |
| New event type published | Update event catalogue table in Plugin Event System diagram |
| IOrderService or IPaymentService changed | Update checkout and refund sequences |
| Avalara / tax provider changed | Update checkout sequence Avalara fallback path |
| Cache TTL or key pattern changed | Update C4 Container Redis container notes |
| New `IScheduleTask` added | Update C4 Container Background Scheduler container |
| ADR decision changes an architectural constraint | Update all diagrams that reference the affected law or rule |

---

## Stale Diagram Policy

```
IF diagram.NextVerificationDue < today AND PR touches subsystem covered by diagram
  → PR is BLOCKED with message:
    "Diagram [{diagram}] is stale (due {date}). Verify against current codebase before merging.
     To bypass: get @arch-lead sign-off and add [FRESHNESS-BYPASS] to PR title (logged in ADR-000)."
```

CI check: `.github/workflows/freshness-check.yml` — parses `FRESHNESS.md` for `Next Due` dates, compares against touched file paths.

---

## How to Verify a Diagram

1. **Run Claude Code discovery** against the relevant subsystem:
   ```
   claude "Review [sequence-checkout.md] against current IOrderService, IPaymentService, 
   and checkout controller. Flag any steps that no longer match the code."
   ```
2. **Check against staging trace** if available (Application Insights → Live Metrics or trace export).
3. **Check external sandbox logs** for payment gateway, Avalara, etc.
4. **Update diagram** to reflect any differences found.
5. **Update this table**: change status to ✅ CURRENT, update Last Verified date and Next Due date.
6. **Commit with message**: `docs: re-verify {diagram-name} — {one-line summary of changes if any}`

---

## Diagrams NOT in this Register (Out of Scope)

The following diagrams are auto-generated and do not require manual re-verification:

| Diagram | Generator | Trigger |
|---|---|---|
| Entity-Relationship (DB schema) | EF Core migration tooling | On migration apply |
| API endpoint inventory | OpenAPI / Swagger | On build |
| SpecKit coverage report | CI gate (Phase 4) | On every PR |
| Plugin dependency graph | `plugin-deps.csx` script | On plugin.json change |

---

## Discovery Run History

| Run Date | Operator | Scope | Undocumented Systems Found |
|---|---|---|---|
| 2026-05-16 | @arch-lead + Claude Code (Opus 4.7) | Full `/src` scan — all `HttpClient` usages, external endpoints, `IPlugin` implementations | Avalara AvaTax (`Nop.Plugin.Tax.Avalara`), Azure AD SSO (`Nop.Plugin.Auth.AzureAD`) |

Both systems added to C4 Context on 2026-05-16. Both added to this register.

**Schedule**: Full discovery run every 6 months, or on any major version upgrade of nopCommerce core.
