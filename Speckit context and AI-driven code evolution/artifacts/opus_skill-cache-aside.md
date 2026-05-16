# Skill: cache-aside-multi-store

**Target path in repo**: `/skills/cache-aside-multi-store.md`  
**Applies law**: LAW-1 (Cache Invalidation Scope), LAW-2 (StoreId in cache keys)  
**Source**: Derived from 3 production cache incidents. Reviewed by @arch-lead 2026-05-16.  
**When to use**: Any time you write code that reads from or writes to `IStaticCacheManager`

---

## The Pattern

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// CACHE-ASIDE READ (store-scoped)
// ─────────────────────────────────────────────────────────────────────────────
public async Task<IList<Product>> GetPublishedProductsAsync(int storeId)
{
    // 1. Build a deterministic cache key that includes storeId
    //    CacheKey format: nop.{prefix}.{version}.{storeId}.{...params}
    //    Never omit storeId for store-scoped data — LAW-2
    var cacheKey = _cacheKeyService.PrepareKeyForDefaultCache(
        NopProductDefaults.ProductsAllByStorePrefix,  // "nop.product.allbystore"
        storeId);

    // 2. Cache-aside: return from cache if present, otherwise load from DB and cache
    return await _cacheManager.GetAsync(cacheKey, async () =>
    {
        return await _productRepository.GetAllAsync(q =>
            q.Where(p => !p.Deleted && p.Published)
             .Where(p => !p.LimitedToStores ||
                         _storeMappingRepository.Table
                             .Any(sm => sm.EntityId == p.Id &&
                                        sm.EntityName == nameof(Product) &&
                                        sm.StoreId == storeId)));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE INVALIDATION after write
// ─────────────────────────────────────────────────────────────────────────────
public async Task UpdateProductAsync(Product product)
{
    // 1. Write to DB via IRepository (triggers entity change notification)
    await _productRepository.UpdateAsync(product);

    // 2. Invalidate specific cache keys — NEVER RemoveByPrefix in multi-node
    //    LAW-1: RemoveByPrefix is node-local on single server,
    //           Redis-wide on cluster. We run 2-instance Azure App Service.
    //    Always use RemoveAsync(specificKey) for targeted invalidation.

    // Invalidate all stores this product might be cached for
    var storeIds = await _storeMappingService.GetStoresIdsWithAccessAsync(product);
    storeIds = storeIds.Append(0).ToArray();  // Include global (storeId=0) if applicable

    foreach (var sid in storeIds)
    {
        var key = _cacheKeyService.PrepareKeyForDefaultCache(
            NopProductDefaults.ProductsAllByStorePrefix, sid);
        await _cacheManager.RemoveAsync(key);
    }

    // Also invalidate the individual product detail key
    await _cacheManager.RemoveAsync(
        _cacheKeyService.PrepareKeyForDefaultCache(
            NopModelCacheDefaults.ProductDetailsCacheKey, product.Id));
}
```

---

## Cache Key Construction Rules

```csharp
// Rule 1: Always include storeId for store-scoped entities
var key = _cacheKeyService.PrepareKeyForDefaultCache(PREFIX, storeId, extraParam);

// Rule 2: Cache key at READ and at INVALIDATION must be built from the SAME prefix
//         and the SAME parameters. Mismatch = stale entry never cleared.

// Rule 3: TTL is set by PrepareKeyForDefaultCache internally (from prefix definition)
//         Product cache: 60 min
//         Settings cache: 60 min
//         Cart cache: 5 min
//         Search results: 10 min
//         Do NOT set TTL manually unless using PrepareKeyForShortTermCache (5 min) or PrepareKeyForLifetime

// Rule 4: Use PrepareKeyForShortTermCache for data that changes frequently (cart, stock qty)
var shortKey = _cacheKeyService.PrepareKeyForShortTermCache(
    NopProductDefaults.ProductStockQuantityKey, productId);
```

---

## Anti-Patterns to Avoid

```csharp
// ❌ ANTI-PATTERN 1: RemoveByPrefix on multi-node
//    Works locally (single node in-memory), silently leaves stale entries in prod
await _cacheManager.RemoveByPrefixAsync(NopProductDefaults.ProductsByIdsPrefix);
// Fix: Use RemoveAsync with specific keys

// ❌ ANTI-PATTERN 2: Missing storeId in cache key for store-scoped data
var key = _cacheKeyService.PrepareKeyForDefaultCache(PREFIX, productId);  // No storeId!
// Store 1 and Store 2 get the same cache entry — wrong prices/availability shown cross-store

// ❌ ANTI-PATTERN 3: Different key params at read vs invalidation
// Read: PrepareKeyForDefaultCache(PREFIX, product.Id, storeId)
// Write: PrepareKeyForDefaultCache(PREFIX, product.Id)  ← missing storeId — never matches

// ❌ ANTI-PATTERN 4: Caching inside a transaction
// Do not read from cache inside an open DB transaction — cached data may be stale
// relative to in-transaction writes. Cache after transaction commits.

// ❌ ANTI-PATTERN 5: Full FLUSHDB as routine invalidation
// Full cache flush causes a DB spike as all keys are rebuilt simultaneously.
// Only use in confirmed production incident with @arch-lead approval.
```

---

## Plugin-Level Cache (Per-Plugin Prefix)

When a plugin needs its own cache entries:

```csharp
// Define prefix in plugin's cache default class
public static class MyPluginCacheDefaults
{
    // Prefix: nop.myplugin.{key}.{storeId}
    public static CacheKey MyDataByStorePrefix =>
        new CacheKey("nop.myplugin.mydata.{0}", "nop.myplugin.");
}

// Usage follows same pattern as above
var key = _cacheKeyService.PrepareKeyForDefaultCache(
    MyPluginCacheDefaults.MyDataByStorePrefix, storeId);

await _cacheManager.GetAsync(key, async () => await LoadFromDb(storeId));

// Invalidation
await _cacheManager.RemoveAsync(
    _cacheKeyService.PrepareKeyForDefaultCache(
        MyPluginCacheDefaults.MyDataByStorePrefix, storeId));
```

---

## Distributed Lock Pattern (ILocker)

For write operations that must be exclusive (e.g., stock initialization, report generation):

```csharp
// ILocker uses Redis SETNX + expiry — works across all App Service instances
var lockKey = $"nop.lock.stockinit.{productId}";
var acquired = await _locker.PerformActionWithLockAsync(lockKey,
    TimeSpan.FromSeconds(30),  // Lock expiry — auto-releases if holder crashes
    async () =>
    {
        // Critical section — only one instance runs this at a time
        var product = await _productRepository.GetByIdAsync(productId);
        if (product.StockQuantity == -1)  // Not yet initialized
        {
            product.StockQuantity = await _erpService.GetCurrentStockAsync(productId);
            await _productRepository.UpdateAsync(product);
        }
    });

if (!acquired)
{
    _logger.LogWarning("Could not acquire stock init lock for product {ProductId}", productId);
}
```

---

## Verification Checklist

After writing cache code, verify:

- [ ] `storeId` included in all keys for store-scoped data
- [ ] `RemoveAsync(specificKey)` used (not `RemoveByPrefixAsync`)
- [ ] Read key and invalidation key built from identical prefix + params
- [ ] No cache read inside open DB transaction
- [ ] TTL appropriate for data change frequency (short-term vs default vs lifetime)
- [ ] Plugin prefix follows `nop.{pluginname}.` convention
