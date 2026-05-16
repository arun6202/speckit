# Runbook — Cache Invalidation Failures (Stale Data After Update)

**Target path in repo**: `/docs/runbooks/cache-invalidation.md`  
**Owner**: @senior-dev-1  
**Last updated**: 2026-05-16  
**Linked law**: LAW-1 (Cache Invalidation Scope)  
**Linked ADR**: ADR-000 (reference), ADR-002 (StoreId in cache keys)

---

## Symptom

Users or admins see stale data after a save operation. Common forms:
- Product price shows old value after admin update
- Stock quantity shows available when product is actually out of stock
- Plugin setting change has no effect until app restart or cache flush
- Search results include deleted products
- Cart shows wrong quantity for a product after inventory update

---

## The Root Cause Pattern (LAW-1)

`IStaticCacheManager.RemoveByPrefixAsync()` behavior differs by deployment:

| Deployment | RemoveByPrefix behavior |
|---|---|
| Single-server (local dev) | Removes from in-memory cache on THIS node only |
| Multi-server (Azure App Service 2+ instances) | Removes from Redis — cluster-wide |

**The trap**: Code that uses `RemoveByPrefixAsync` works in local dev (single node) and silently fails in production (multi-node). The other node's in-memory cache is not invalidated. Some users hit node A (stale), some hit node B (fresh). Intermittent and hard to reproduce.

**The fix**: Use `RemoveAsync(specificKey)` for targeted invalidation. Specific key invalidation always goes to Redis, which is authoritative for all nodes.

---

## Diagnostic Flow

```mermaid
flowchart TD
  S([Stale data after save]) --> Q1{Is this reproducible on EVERY request or only some?}
  
  Q1 -->|Every request| DB[Possible: save did not commit to DB]
  Q1 -->|Only some requests| MULTI[Multi-node issue — LAW-1]
  Q1 -->|Only after app restart it fixes| INMEM[In-memory cache not invalidated]

  MULTI --> M1[Check: How many App Service instances?]
  M1 -->|1 instance| INMEM
  M1 -->|2+ instances| M2[Check: Is invalidation using RemoveByPrefix or RemoveAsync?]
  M2 -->|RemoveByPrefix| L1FIX[LAW-1 violation — switch to RemoveAsync with specific key]
  M2 -->|RemoveAsync| M3[Check: Is cache key construction deterministic?]
  M3 -->|Key includes storeId| M4[Check: Is storeId correct at save time vs read time?]
  M3 -->|Key includes version param| M5[Check: Version param matches between save and read]

  DB --> DB1[redis-cli: GET {cacheKey} — does it exist?]
  DB1 -->|Key missing| DB2[Cache miss — DB should serve fresh. Check DB record directly]
  DB1 -->|Key present with old value| DB3[Cache not invalidated on save]

  INMEM --> IM1[Are you running single-node? RemoveByPrefix works here but will fail in prod]
  IM1 -->|Yes| IM2[Fix NOW before multi-node deploy — switch to RemoveAsync]
```

---

## Step-by-Step Diagnosis

### Step 1 — Check number of App Service instances

In Azure Portal:
- App Service → Scale Out → Current instance count

Or via Application Insights:
```kusto
// KQL — see which server instances are handling requests
requests
| where timestamp > ago(1h)
| summarize count() by cloud_RoleInstance
| order by count_ desc
```

If instance count > 1, any `RemoveByPrefixAsync` that is NOT backed by Redis publish/subscribe is a LAW-1 violation.

### Step 2 — Find the invalidation call

```bash
grep -rn "RemoveByPrefix\|RemoveAsync\|ClearCache" src/Libraries/Nop.Services/ src/Plugins/
```

Identify which cache manager method is called after the save:

```csharp
// PROBLEMATIC — works on single node, fails silently on multi-node
await _cacheManager.RemoveByPrefixAsync(NopProductDefaults.ProductsByIdsPrefix);

// CORRECT — always goes to Redis, invalidates all nodes
await _cacheManager.RemoveAsync(NopModelCacheDefaults.ProductDetailsCacheKey.FillCacheKey(productId, storeId, ...));
```

### Step 3 — Reconstruct the cache key

Cache keys follow the pattern:
```
nop.{prefix}.{version}.{param1}.{param2}...
```

Find the key definition:
```bash
grep -rn "CacheKey\|NopModelCacheDefaults\|NopProductDefaults" src/Libraries/Nop.Core/Caching/
```

Example product stock key:
```csharp
// In NopProductDefaults.cs
public static CacheKey ProductsByIdsPrefix => new CacheKey("nop.product.byids.{0}", ...);
// {0} = productId
// Full key: nop.product.byids.42.v1.storeId2
```

In Redis, verify what key is actually stored:
```bash
redis-cli KEYS "nop.product*42*"
# Returns: nop.product.byids.42.v1.2
```

Then verify the invalidation call uses exactly that key:
```csharp
// Must match the key built at read time
await _cacheManager.RemoveAsync(
    NopProductDefaults.ProductsByIdsPrefix.FillCacheKey(product.Id));
```

### Step 4 — Check storeId in cache key

Multi-store cache isolation requires `storeId` in every cache key that is store-scoped.

```bash
# Check the key — does it include storeId?
redis-cli GET "nop.product.details.42"        # WRONG — no storeId
redis-cli GET "nop.product.details.42.2"      # CORRECT — storeId=2
```

If the read key includes storeId but the invalidation key does not (or uses a different storeId), the stale key remains in Redis.

```csharp
// Read: includes storeId
var cacheKey = _cacheKeyService.PrepareKeyForDefaultCache(
    NopModelCacheDefaults.ProductDetailsCacheKey, product, storeId);  // storeId required

// Save/invalidation: must use SAME storeId
await _cacheManager.RemoveAsync(
    _cacheKeyService.PrepareKeyForDefaultCache(
        NopModelCacheDefaults.ProductDetailsCacheKey, product, _storeContext.CurrentStore.Id));
```

### Step 5 — Manual cache investigation via redis-cli

```bash
# Connect (Azure Redis with TLS)
redis-cli -h {hostname}.redis.cache.windows.net -p 6380 -a {accessKey} --tls

# Scan for affected keys (use SCAN not KEYS in production — KEYS blocks)
SCAN 0 MATCH "nop.product*" COUNT 100

# Check specific key value and TTL
GET nop.product.byids.42.v1.2
TTL nop.product.byids.42.v1.2

# Manual forced invalidation (use only in confirmed incident, not routine ops)
DEL nop.product.byids.42.v1.2

# Flush ALL cache (nuclear option — only with approval, causes DB spike)
FLUSHDB  # ← requires @arch-lead approval
```

### Step 6 — Emergency full cache flush

Only when:
- Multiple product/price/stock corruptions are active simultaneously
- Individual key invalidation cannot be done in time
- @arch-lead has approved

```bash
# Via nopCommerce admin panel (safest)
Admin → System → System Information → Clear cache

# Via redis-cli (immediate, no app restart needed)
redis-cli -h {host} -p 6380 -a {password} --tls FLUSHDB
```

After full flush: expect DB load spike for 5-10 minutes as cache warms. Monitor:
- Application Insights → Live Metrics → CPU + Dependencies
- Azure SQL DTU usage (Azure Portal → SQL Database → Overview)

---

## Resolution Matrix

| Root Cause | Fix | Time | Risk |
|---|---|---|---|
| `RemoveByPrefixAsync` on multi-node | Switch to `RemoveAsync(specificKey)` | 30 min | Low |
| Wrong storeId in invalidation key | Add `_storeContext.CurrentStore.Id` to key | 15 min | Low |
| Save bypasses `IRepository<T>` (raw SQL) | Use `IRepository<T>` which triggers change notification | 1 hour | Medium |
| Cache key params don't match between read and write | Audit key construction in both read and write paths | 1 hour | Low |
| Stale in-memory cache after Redis invalidation | Azure Redis + ASP.NET Core session config issue | 2 hours | Medium — requires infra check |
| Emergency: multiple stale keys | Full cache flush via admin panel | 2 min | Medium — DB spike |

---

## Prevention Checklist (for PR review)

When a PR touches a service that reads from or writes to the cache:

- [ ] Invalidation uses `RemoveAsync(specificKey)` not `RemoveByPrefixAsync` — unless a prefix sweep is intentional AND deployment is confirmed single-node
- [ ] Cache key construction includes `storeId` for any store-scoped data
- [ ] Cache key at read time and cache key at invalidation time are built from the same `CacheKey` definition
- [ ] Any direct DB write (outside `IRepository<T>`) is accompanied by explicit cache invalidation

---

## When to Escalate

Escalate to @arch-lead if:
- Cache invalidation is correct in code but stale data persists (possible Redis connectivity issue or ASP.NET Core distributed cache misconfiguration)
- The stale data is in a read replica (not currently deployed, but future topology change)
- The fix requires adding a new cache key definition — this touches Nop.Core and needs arch review
- A full FLUSHDB is being considered — requires @arch-lead approval
