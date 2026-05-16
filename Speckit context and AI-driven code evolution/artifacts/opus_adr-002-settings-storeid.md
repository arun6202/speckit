# ADR-002 — StoreId Semantics: Global Default vs Store-Specific Override

**Target path in repo**: `/docs/adr/ADR-002-settings-storeid.md`  
**Status**: Accepted  
**Date**: 2026-05-16  
**Deciders**: @arch-lead, @senior-dev-1  
**Supersedes**: None — documents an existing undocumented constraint (LAW-2)

---

## Context

During the Phase 0 discovery run, we found that `StoreId` has **different semantics in different tables**. This is not documented anywhere in the codebase or existing wiki. Two production incidents (described below) were caused by AI-generated code and new-hire code that assumed a uniform meaning for `StoreId=0`.

The conflicting meanings:
- **In the `Setting` table**: `StoreId=0` means **GLOBAL DEFAULT** — the setting applies to all stores unless overridden by a store-specific record with `StoreId=N`
- **In the `Order` table**: `StoreId=0` means **UNASSIGNED / ERROR STATE** — a valid order always has `StoreId >= 1`. `StoreId=0` indicates the order was not correctly associated with a store.
- **In the `Customer` table**: `StoreId=0` is used for **admin-created customers** or customers migrated from a single-store version — a soft "no store" affiliation

---

## Decision

1. **Document the three-table semantic difference as LAW-2** in the root CLAUDE.md. Every code session touching multi-store logic must read LAW-2 before proceeding.

2. **Codify the lookup pattern** for each table:

   **Settings (ISettingService)**:
   ```csharp
   // CORRECT: Always pass storeId. Falls back to StoreId=0 (global) automatically.
   var setting = await _settingService.GetSettingByKeyAsync<string>(
       "MyPlugin.SomeKey", defaultValue: null, storeId: _storeContext.CurrentStore.Id, loadSharedValueIfNotFound: true);
   // loadSharedValueIfNotFound=true means: if no store-specific record, return the StoreId=0 global record
   
   // WRONG: Never query Setting table directly for StoreId=0 assuming it's always the right value
   // var wrong = await _settingService.GetSettingByKeyAsync<string>("key", storeId: 0);
   // ^ This returns ONLY the global record, skipping any store-specific override
   ```

   **Orders**:
   ```csharp
   // CORRECT: Validate StoreId before order processing
   if (order.StoreId == 0)
       throw new NopException($"Order {order.Id} has invalid StoreId=0 — store association missing");
   
   // WRONG: Never filter orders with WHERE StoreId=0 expecting to find "all orders"
   // That returns only incorrectly-associated orders, not all orders
   ```

   **Customers**:
   ```csharp
   // Admin-created customers legitimately have StoreId=0
   // Do not reject customers with StoreId=0 — use storeId=0 as "no affiliation" signal only
   // For store-specific customer lists: filter WHERE StoreId=@storeId OR StoreId=0
   ```

3. **SpecKit rule**: Any SpecKit spec for a plugin that reads or writes `Setting` or `Order` tables MUST include a `storeid_semantics` field documenting which convention applies.

4. **CLAUDE.md rule**: When Claude Code generates queries filtering by `StoreId`, it must:
   - For `Setting` queries: use `ISettingService` API (never raw SQL/LINQ on Setting table)
   - For `Order` queries: add a guard that `StoreId=0` is an invalid state
   - For `Customer` queries: treat `StoreId=0` as valid (no-affiliation)

---

## Rationale

**Why document this as an ADR rather than just a CLAUDE.md rule?**

The setting lookup fallback chain (`StoreId=N → StoreId=0`) is a deliberate design decision in nopCommerce core that cannot be changed without breaking multi-store behavior. The `Order.StoreId=0` semantic is a consequence of an early architectural decision about default column values.

These are not bugs to fix — they are invariants to understand and preserve. ADR format is appropriate because:
- It records WHY the semantics exist (historical context)
- It records the decision NOT to change the semantics (assessed and accepted)
- It provides the evidence (incidents) that justify the rule

A CLAUDE.md rule says WHAT to do. An ADR records WHY and what alternatives were rejected.

**Why not unify the semantics?**

Option assessed: Change `Setting.StoreId=0` to mean "unassigned" and use a separate `IsGlobal` column.

Rejected because:
- ~60% of Setting table records use `StoreId=0` as global default — migration cost is high
- `ISettingService` API already abstracts the fallback chain — callers using the API are unaffected
- The risk of a migration introducing bugs outweighs the developer ergonomics gain
- The confusion is at the raw query level only — callers using `ISettingService` never see `StoreId=0` directly

---

## Incident History (caused this ADR)

| Incident | Date | Root Cause |
|---|---|---|
| ERPPlugin sent all orders to wrong ERP tenant | 2024-Q2 | AI-generated code filtered orders with `WHERE StoreId=0` thinking it meant "global/all stores". Returned only corrupt orders. ERP received 0 records, triggered missed-sync alert. | 
| Plugin settings reverted to defaults on store 2 | 2025-Q1 | New developer queried `Setting WHERE StoreId=0` to load config, skipping all store-2-specific overrides. Store 2 ran with global defaults for 6 hours. |

Both incidents had the same pattern: code assumed `StoreId=0` meant "all stores" or "default for all" uniformly. The Setting table uses it that way; the Order table does not.

---

## StoreId Semantics Reference Table

| Table | StoreId=0 Means | StoreId=N Means | Safe to Query Directly? |
|---|---|---|---|
| `Setting` | Global default (fallback if no store-specific record) | Store-specific override | No — use `ISettingService` API |
| `Order` | Invalid / unassigned (error state) | Associated with store N | Yes — but guard `StoreId != 0` |
| `Customer` | No store affiliation (admin-created or migrated) | Registered in store N | Yes — treat 0 as valid no-affiliation |
| `Product` (via `StoreMapping`) | Published in all stores (if `LimitedToStores=false`) | Published only in mapped stores | Use `IStoreMappingService` API |
| `Category` (via `StoreMapping`) | Same as Product | Same as Product | Use `IStoreMappingService` API |
| `Discount` | Applies to all stores | Applies to store N only | Use `IDiscountService` API |

---

## Consequences

**Positive**:
- LAW-2 in CLAUDE.md prevents recurrence in AI-generated code
- `ISettingService` API hides the raw `StoreId=0` semantic from most callers
- ADR provides incident evidence to justify the rule to new team members

**Negative**:
- Raw SQL queries (migrations, reports, data exports) must still handle the semantic difference manually
- No compile-time enforcement — only lint/review gate via Claude Code and PR review
- `StoreId=0` as global-default in Setting table remains confusing for developers from non-nopCommerce backgrounds

**Enforcement**:
- CLAUDE.md LAW-2 is read at session start for all multi-store tasks
- SpecKit `storeid_semantics` field on all relevant plugin specs
- PR review checklist item: "Does this code touch Setting or Order with a StoreId filter? Verify LAW-2 semantics."
