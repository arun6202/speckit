# Skill: plugin-settings

**Target path in repo**: `/skills/plugin-settings.md`  
**Applies law**: LAW-4 (Settings Read Timing), LAW-2 (StoreId Semantics)  
**Source**: Derived from 2 production settings incidents. Reviewed by @arch-lead 2026-05-16.  
**When to use**: Any time you read or write plugin settings via `ISettingService`

---

## Settings Class Definition

```csharp
// Define a strongly-typed settings class (one per plugin)
// Conventionally lives in: Nop.Plugin.YourPlugin/Models/YourPluginSettings.cs
public class YourPluginSettings : ISettings
{
    // All properties should have sensible defaults
    // These are the values returned when no Setting record exists in the DB
    public bool FeatureEnabled { get; set; } = false;
    public string ApiEndpoint { get; set; } = string.Empty;
    public int MaxRetryAttempts { get; set; } = 3;
    public decimal CommissionRate { get; set; } = 0.05m;
}
```

---

## Reading Settings (Correct Patterns)

```csharp
// ─────────────────────────────────────────────────────────────────────────────
// PATTERN A: Load full settings object (preferred for multiple settings reads)
// ─────────────────────────────────────────────────────────────────────────────
public class YourPluginService : IYourPluginService
{
    private readonly ISettingService _settingService;
    private readonly IStoreContext _storeContext;

    public YourPluginService(ISettingService settingService, IStoreContext storeContext)
    {
        _settingService = settingService;
        _storeContext = storeContext;
    }

    private async Task<YourPluginSettings> GetSettingsAsync()
    {
        // LAW-2: Use CurrentStore.Id — NOT 0. StoreId=0 in LoadSettingAsync
        //        reads ONLY the global record, skipping store-specific overrides.
        var storeId = (await _storeContext.GetCurrentStoreAsync()).Id;
        return await _settingService.LoadSettingAsync<YourPluginSettings>(storeId);
        // LoadSettingAsync automatically applies global fallback:
        //   1. Try Setting WHERE Name='YourPlugin.X' AND StoreId={storeId}
        //   2. If not found: Setting WHERE Name='YourPlugin.X' AND StoreId=0
    }

    public async Task<bool> IsFeatureEnabledAsync()
    {
        var settings = await GetSettingsAsync();
        return settings.FeatureEnabled;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN B: Read a single key (for quick conditional checks)
// ─────────────────────────────────────────────────────────────────────────────
var storeId = (await _storeContext.GetCurrentStoreAsync()).Id;
var enabled = await _settingService.GetSettingByKeyAsync<bool>(
    "YourPlugin.FeatureEnabled",
    defaultValue: false,           // Returned if no DB record found
    storeId: storeId,              // LAW-2: always pass current store's ID
    loadSharedValueIfNotFound: true // LAW-2: fall back to StoreId=0 if store-specific not found
);
```

---

## LAW-4: Never Read Settings in Initialize()

```csharp
// ❌ WRONG — IStoreContext is NOT ready during Initialize()
//    GetSettingByKey returns null silently — no exception, no warning
public class YourPlugin : BasePlugin
{
    private readonly ISettingService _settingService;
    private bool _featureEnabled;

    public override void Initialize()
    {
        // IStoreContext not ready — this returns null/default
        _featureEnabled = _settingService.GetSettingByKey<bool>("YourPlugin.FeatureEnabled");
    }
}

// ✅ CORRECT — read lazily in the service method, not at startup
public class YourPlugin : BasePlugin
{
    // Do NOT store settings as fields — read them lazily per request

    public override async Task InstallAsync()
    {
        // Install IS safe to read settings — called after full startup
        // But typically you SAVE defaults here, not READ
        await _settingService.SaveSettingAsync(new YourPluginSettings());
        await base.InstallAsync();
    }

    public override async Task UninstallAsync()
    {
        // Always clean up settings on uninstall
        await _settingService.DeleteSettingAsync<YourPluginSettings>();
        await base.UninstallAsync();
    }
}
```

---

## Writing Settings (Admin Panel Pattern)

```csharp
// Admin controller action — save plugin configuration
[HttpPost]
public async Task<IActionResult> Configure(YourPluginConfigureModel model)
{
    if (!ModelState.IsValid)
        return await Configure();  // Reload form with validation errors

    // LAW-2: Save with the currently selected store's ID
    // Admin URL should include ?storeId=N for store-specific config
    var storeId = model.ActiveStoreScopeConfiguration;  // From base class helper

    // Save only changed settings per active store
    var settings = await _settingService.LoadSettingAsync<YourPluginSettings>(storeId);

    settings.FeatureEnabled = model.FeatureEnabled;
    settings.ApiEndpoint = model.ApiEndpoint;
    settings.MaxRetryAttempts = model.MaxRetryAttempts;

    // SaveSettingAsync handles cache invalidation automatically
    // Do NOT call _cacheManager.RemoveAsync manually after this — double-invalidation
    await _settingService.SaveSettingAsync(settings, storeId);

    // Handle "Override for this store" checkbox pattern (nopCommerce multi-store admin)
    await _settingService.SaveSettingOverridablePerStoreAsync(
        settings, x => x.FeatureEnabled, model.FeatureEnabled_OverrideForStore, storeId, false);
    await _settingService.SaveSettingOverridablePerStoreAsync(
        settings, x => x.ApiEndpoint, model.ApiEndpoint_OverrideForStore, storeId, false);

    // Single explicit save after all overrides configured
    await _settingService.ClearCacheAsync();  // Only if using the override pattern above

    _notificationService.SuccessNotification(
        await _localizationService.GetResourceAsync("Admin.Plugins.Saved"));

    return await Configure();
}
```

---

## Install / Uninstall Settings Lifecycle

```csharp
// InstallAsync — save defaults, register localization resources, add schedule tasks
public override async Task InstallAsync()
{
    // Save default settings (creates StoreId=0 global records)
    await _settingService.SaveSettingAsync(new YourPluginSettings
    {
        FeatureEnabled = false,
        MaxRetryAttempts = 3,
        CommissionRate = 0.05m
    });

    // Register localization strings
    await _localizationService.AddOrUpdateLocaleResourceAsync(new Dictionary<string, string>
    {
        ["Plugins.YourPlugin.FeatureEnabled"] = "Enable feature",
        ["Plugins.YourPlugin.FeatureEnabled.Hint"] = "Check to enable the plugin feature."
    });

    await base.InstallAsync();
}

// UninstallAsync — clean up settings, localization resources, DB tables if any
public override async Task UninstallAsync()
{
    // Remove ALL setting records (all stores) — DeleteSettingAsync<T> removes all StoreId variants
    await _settingService.DeleteSettingAsync<YourPluginSettings>();

    // Remove localization strings
    await _localizationService.DeleteLocaleResourcesAsync("Plugins.YourPlugin");

    await base.UninstallAsync();
}
```

---

## StoreId Semantics Cheat Sheet (LAW-2)

```
Setting table:
  StoreId=0  → Global default. Read if no store-specific record exists.
  StoreId=N  → Store N specific. Overrides StoreId=0 for store N.

What ISettingService.LoadSettingAsync(storeId) does:
  1. SELECT WHERE Name LIKE 'YourPlugin.%' AND StoreId=N
  2. For any key not found in step 1: SELECT WHERE Name=key AND StoreId=0
  3. Populates settings object from combined result
  Result: store-specific values override globals, globals fill gaps

What ISettingService.LoadSettingAsync(storeId: 0) does:
  1. SELECT WHERE Name LIKE 'YourPlugin.%' AND StoreId=0  ONLY
  2. No fallback needed — this IS the global record
  Use case: reading global admin config, not per-store tenant config
```

---

## Verification Checklist

- [ ] No settings read in `IPlugin.Initialize()` — deferred to service method (LAW-4)
- [ ] `LoadSettingAsync` or `GetSettingByKeyAsync` called with current store's ID, not 0 (LAW-2)
- [ ] `loadSharedValueIfNotFound: true` passed to `GetSettingByKeyAsync` for multi-store fallback (LAW-2)
- [ ] `SaveSettingAsync` used (not raw DB write) — handles cache invalidation
- [ ] `DeleteSettingAsync<TSettings>` called in `UninstallAsync` — no orphaned Setting records
- [ ] Admin form handles multi-store override checkboxes via `SaveSettingOverridablePerStoreAsync`
