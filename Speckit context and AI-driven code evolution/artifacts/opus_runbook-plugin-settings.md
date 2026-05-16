# Runbook — Plugin Settings Not Loading (Returns Null or Default)

**Target path in repo**: `/docs/runbooks/plugin-settings-not-loading.md`  
**Owner**: @senior-dev-1  
**Last updated**: 2026-05-16  
**Linked law**: LAW-4 (Settings Read Timing) + LAW-2 (StoreId Semantics)  
**Linked ADR**: ADR-002

---

## Symptom

Plugin behaves as if its settings are all empty or default values, even though the admin panel shows correct configuration. May surface as:
- Plugin feature disabled when admin panel shows it enabled
- Null reference exceptions in plugin code that reads settings on startup
- Wrong store's settings applied to all stores
- Settings that were saved in the admin panel having no effect until app restart

---

## Diagnostic Flow

```mermaid
flowchart TD
  S([Settings not loading]) --> Q1{When does the bug occur?}

  Q1 -->|On first app startup| L4[LAW-4: Initialize timing issue]
  Q1 -->|After admin saves| CACHE[Cache not invalidated]
  Q1 -->|Wrong store's settings| L2[LAW-2: StoreId semantics]
  Q1 -->|Settings load fine on dev, fail on prod| DEPLOY[Multi-server cache topology]

  L4 --> L4A[Check: Is ISettingService called inside IPlugin.Initialize?]
  L4A -->|Yes| L4FIX[Move setting read to first request handler or constructor injection]
  L4A -->|No| L4B[Check: Is IStoreContext injected in constructor?]
  L4B -->|Yes| L4BFIX[IStoreContext not ready at startup — use Lazy or IHttpContextAccessor]

  CACHE --> CA[Check: Was cache key correct on save?]
  CA --> CA2[redis-cli: GET nop.setting.{SettingName}.{StoreId}]
  CA2 -->|Key missing| CA3[Cache was invalidated — reload should work. Check if load reads same key]
  CA2 -->|Key present with old value| CA4[Admin save did not invalidate. Check ISettingService.SaveSettingAsync called, not raw SQL]

  L2 --> L2A[Check: Is setting read with loadSharedValueIfNotFound=true?]
  L2A -->|No| L2FIX[Add loadSharedValueIfNotFound=true to GetSettingByKeyAsync call]
  L2A -->|Yes| L2B[Check: Is storeId passed as 0?]
  L2B -->|Yes| L2BFIX[Pass _storeContext.CurrentStore.Id — StoreId=0 reads global only]

  DEPLOY --> DA[LAW-1: RemoveByPrefix is node-local on single-node, Redis-wide on cluster]
  DA --> DA2[Check deployment: is this 2-instance Azure App Service?]
  DA2 -->|Yes| DA3[All invalidation must target Redis keys directly, not prefix sweep]
```

---

## Step-by-Step Diagnosis

### Step 1 — Identify where the setting is read

Find the setting read call in the plugin:

```bash
# In plugin source directory
grep -rn "GetSettingByKey\|LoadSetting\|ISettingService" Nop.Plugin.{YourPlugin}/
```

Note the method signature. The three patterns:

```csharp
// Pattern A: GetSettingByKeyAsync — single key
await _settingService.GetSettingByKeyAsync<string>(
    "YourPlugin.FeatureEnabled",
    defaultValue: "false",
    storeId: {storeId},
    loadSharedValueIfNotFound: true  // ← REQUIRED for multi-store fallback
);

// Pattern B: LoadSettingAsync — full settings object
await _settingService.LoadSettingAsync<YourPluginSettings>(storeId);
// storeId must be _storeContext.CurrentStore.Id — NOT 0

// Pattern C: Constructor injection — INVALID if plugin is singleton
// Settings injected at DI build time are the values at startup — never updated
```

### Step 2 — Check for LAW-4 (Initialize timing)

```csharp
// SEARCH for this anti-pattern:
public class YourPlugin : BasePlugin
{
    private readonly ISettingService _settingService;

    public override async Task InstallAsync()  // ← OK to read settings here (after startup)
    { }

    public override void Initialize()  // ← DANGER ZONE
    {
        var setting = _settingService.GetSettingByKey<string>("key");  // Returns null — IStoreContext not ready
    }
}
```

**Fix**: Move setting reads out of `Initialize()` into the first method that handles a real request:

```csharp
public class YourPluginService : IYourPluginService
{
    private readonly ISettingService _settingService;
    private readonly IStoreContext _storeContext;

    // Constructor injection is fine — IStoreContext is ready after startup
    public YourPluginService(ISettingService settingService, IStoreContext storeContext)
    {
        _settingService = settingService;
        _storeContext = storeContext;
    }

    public async Task<bool> IsFeatureEnabledAsync()
    {
        // Read lazily on first call — never in Initialize()
        var storeId = (await _storeContext.GetCurrentStoreAsync()).Id;
        return await _settingService.GetSettingByKeyAsync<bool>(
            "YourPlugin.FeatureEnabled", defaultValue: false,
            storeId: storeId, loadSharedValueIfNotFound: true);
    }
}
```

### Step 3 — Check Redis cache state

```bash
# Connect to Redis (Azure Cache connection string from Key Vault or appsettings)
redis-cli -h {host} -p 6380 -a {password} --tls

# Look for your setting's cache key
KEYS nop.setting*
# OR targeted:
GET nop.setting.YourPlugin.FeatureEnabled.{storeId}
GET nop.setting.YourPlugin.FeatureEnabled.0

# Check TTL
TTL nop.setting.YourPlugin.FeatureEnabled.{storeId}
# Returns -2 if key doesn't exist (cache miss — will reload from DB on next read)
# Returns -1 if key has no expiry (bug — settings should have 60min TTL)
# Returns N seconds remaining
```

If the cache key has the old value and admin save did not clear it:

```bash
# Manual invalidation (use sparingly — prefer fixing the code)
DEL nop.setting.YourPlugin.FeatureEnabled.{storeId}
DEL nop.setting.YourPlugin.FeatureEnabled.0
```

### Step 4 — Verify the admin save path

Check that the admin panel calls `ISettingService.SaveSettingAsync()` (not raw DB):

```csharp
// CORRECT admin save pattern
await _settingService.SaveSettingAsync(new YourPluginSettings
{
    FeatureEnabled = model.FeatureEnabled
}, storeId: model.StoreId);  // SaveSettingAsync handles cache invalidation

// WRONG — raw DB save skips cache invalidation
await _context.SaveChangesAsync();  // Cache still has old value
```

### Step 5 — Verify multi-store fallback chain

Test that store-specific settings override global:

```sql
-- In SQL Server (read-only diagnosis)
SELECT Name, Value, StoreId
FROM Setting
WHERE Name LIKE 'YourPlugin.%'
ORDER BY Name, StoreId;

-- Expected for correct multi-store setup:
-- YourPlugin.FeatureEnabled | false | 0  (global default)
-- YourPlugin.FeatureEnabled | true  | 2  (store 2 override)
```

If only `StoreId=0` records exist and you're expecting store-specific behavior, the admin panel is saving with `StoreId=0` (global) instead of the current store's ID. Check the admin controller:

```csharp
// Admin controller — get storeId from query string, not hardcoded 0
var storeId = int.Parse(Request.Query["storeId"].FirstOrDefault() ?? "0");
if (storeId == 0)
    storeId = (await _storeContext.GetCurrentStoreAsync()).Id;
```

---

## Resolution Matrix

| Root Cause | Fix | Time to Apply |
|---|---|---|
| Settings read in `Initialize()` | Move to first request handler (LAW-4) | 30 min |
| `loadSharedValueIfNotFound=false` | Add `true` parameter (LAW-2) | 5 min |
| `storeId=0` passed to `GetSettingByKeyAsync` | Use `_storeContext.CurrentStore.Id` | 10 min |
| Admin save uses raw DB (skips cache) | Switch to `ISettingService.SaveSettingAsync` | 1 hour |
| Redis cache stale after multi-node deploy | Manual `DEL` of affected keys | 2 min (immediate) |
| Constructor injection of settings value | Change to lazy read via `ISettingService` | 30 min |

---

## When to Escalate

Escalate to @arch-lead if:
- The setting read uses a code path not covered by this runbook
- Settings load correctly in single-server but fail on multi-node Azure App Service (LAW-1 cache topology)
- The Setting table has records but `GetSettingByKeyAsync` always returns null after cache miss (possible EF Core mapping issue)
- Changes to `ISettingService` registration in DI are needed
