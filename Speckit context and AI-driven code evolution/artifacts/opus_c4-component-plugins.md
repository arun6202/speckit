# C4 Component Diagram — Plugin Engine Internals

**Target path in repo**: `/docs/architecture/component-plugins.md`  
**Verified**: 2026-05-16 by @arch-lead (against ILSpy decompilation of Nop.Web.Framework + Autofac registration logs)  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Source**: Discovery run 2026-05-16 — manual trace through plugin bootstrap sequence

---

## Plugin Engine Component Diagram

```mermaid
C4Component
  title Component Diagram — Plugin Engine (Nop.Web.Framework)

  Container_Boundary(pluginEngine, "Plugin Engine") {

    Component(pluginLoader, "PluginLoader", "C# class — Nop.Core.Plugins.PluginLoader", "Scans /Plugins/ directory at startup. Reads plugin.json descriptor from each subfolder. Validates: SystemName unique, Version semver-valid, DependsOn all present. Loads assembly via Assembly.LoadFrom(). Populates PluginDescriptor registry. CRITICAL: scan order = folder name alphabetical — this is load order (ADR-001).")

    Component(pluginDescriptor, "PluginDescriptor Registry", "In-memory — IList<PluginDescriptor>", "Holds metadata for all loaded plugins: SystemName, FriendlyName, Version, Author, DependsOn[], IsInstalled, IsActive, PluginType, Assembly reference. Persisted state (Installed/Active) stored in InstalledPlugins.json and Plugin table in SQL. Read by admin panel to show plugin list.")

    Component(autofacRegistrar, "AutofacRegistrar", "IRegistrar — executed per plugin assembly", "For each loaded assembly, discovers all classes implementing: IPlugin, IConsumer<T>, IWidgetPlugin, IExternalAuthMethod, IPaymentMethod, IShippingRateComputationMethod, ITaxProvider, IScheduleTask, ISettingService. Registers into Autofac container. Registration order = plugin folder alpha order — this is IConsumer<T> dispatch order (ADR-001, LAW-3).")

    Component(diContainer, "Autofac DI Container", "Autofac 6 — ILifetimeScope", "Root lifetime scope built at startup. Plugin services registered with InstancePerLifetimeScope (per-request). IConsumer<T> resolved as IEnumerable<IConsumer<T>> by IEventPublisher — all registered handlers. IWidgetPlugin resolved by zone name. Named registrations for IPaymentMethod, IShippingMethod by SystemName.")

    Component(pluginInitializer, "Plugin Initializer", "IPlugin.Initialize() call loop", "After DI container built, calls IPlugin.Initialize() on each active plugin in alpha order. CRITICAL (LAW-4): IStoreContext is NOT ready during Initialize(). Any ISettingService.GetSettingByKey() call here returns null silently. Settings must be read lazily — on first request handler, not in Initialize().")

    Component(widgetEngine, "Widget Rendering Engine", "IWidgetPlugin + View Zone system", "IWidgetPlugin.GetWidgetZones() returns zone names plugin targets (e.g., 'productdetails_top', 'checkout_confirm_bottom'). Razor view zones call @await Component.InvokeAsync('Widget', zone) which resolves all IWidgetPlugin registered for that zone and renders their views. Render order = alpha order of plugin folder.")

    Component(routePublisher, "Route Publisher", "IRouteProvider per plugin", "Each plugin implements IRouteProvider.RegisterRoutes(IEndpointRouteBuilder). Called during ASP.NET Core route building. Plugin controllers live in plugin assemblies — Razor view engine configured to search plugin view paths. Plugin area name = SystemName.")

    Component(settingsMgr, "Plugin Settings Manager", "ISettingService — backed by Setting table + Redis", "Reads/writes Setting table (Name, Value, StoreId). Cache key: nop.setting.{Name}.{StoreId}. TTL: 60min. On admin save: cache invalidated, Setting table updated. StoreId=0 = global default; StoreId=N = store-specific override. Plugins use strongly-typed settings classes — loaded via ISettingService.LoadSetting<TSettings>(storeId).")

    Component(eventPublisher, "IEventPublisher", "EventPublisher — Nop.Services.Events", "Resolve IEnumerable<IConsumer<T>> from DI for event type T. Call HandleEvent() on each in registration order (= alpha order). Wrap each call — catch Exception, log as Error, continue to next handler. No parallelism. No async. Total dispatch time = sum of all handler times. LAW-3: handlers MUST be void, MUST catch all exceptions internally.")
  }

  Container_Ext(fileSystem, "Plugin /Plugins/ Directory", "File system", "One subfolder per plugin. Each contains: plugin.json, {AssemblyName}.dll, Views/, wwwroot/. Folder name determines load order.")
  Container_Ext(db, "SQL Server", "Database", "Plugin table (IsInstalled), InstalledPlugins.json (legacy), Setting table (plugin config)")
  Container_Ext(redis, "Redis", "Cache", "Setting cache (60min TTL). Widget zone cache (per-store).")
  Container_Ext(aspnetCore, "ASP.NET Core Host", "Web framework", "Calls IPlugin.Initialize() during startup. Provides IEndpointRouteBuilder to IRouteProvider.")

  Rel(pluginLoader, fileSystem, "Scans subfolders, reads plugin.json, loads assemblies")
  Rel(pluginLoader, pluginDescriptor, "Populates descriptor registry")
  Rel(pluginDescriptor, db, "Reads/writes IsInstalled, IsActive state")
  Rel(autofacRegistrar, pluginDescriptor, "Reads loaded assemblies from descriptor registry")
  Rel(autofacRegistrar, diContainer, "Registers plugin services, IConsumer<T>, IWidgetPlugin, etc.")
  Rel(pluginInitializer, diContainer, "Resolves IPlugin instances from DI")
  Rel(pluginInitializer, aspnetCore, "Called by ASP.NET Core startup pipeline")
  Rel(widgetEngine, diContainer, "Resolves IWidgetPlugin[] by zone name at render time")
  Rel(routePublisher, aspnetCore, "Registers plugin controller routes into endpoint router")
  Rel(settingsMgr, db, "Reads/writes Setting table")
  Rel(settingsMgr, redis, "Caches setting values, invalidates on save")
  Rel(eventPublisher, diContainer, "Resolves IConsumer<T>[] per event type")
```

---

## Plugin Startup Sequence

```mermaid
sequenceDiagram
  autonumber
  participant Host as ASP.NET Core Host
  participant Loader as PluginLoader
  participant FS as /Plugins/ Directory
  participant Registry as PluginDescriptor Registry
  participant Autofac as AutofacRegistrar
  participant DI as DI Container
  participant Init as IPlugin.Initialize()
  participant Routes as IRouteProvider

  Host->>Loader: Scan plugins (Program.cs startup)
  Loader->>FS: List subdirectories (alphabetical)
  loop For each /Plugins/{FolderName}/
    Loader->>FS: Read plugin.json
    Loader->>Loader: Validate descriptor (SystemName unique, DependsOn present)
    Loader->>FS: Assembly.LoadFrom({FolderName}.dll)
    Loader->>Registry: Add PluginDescriptor { SystemName, Assembly, FolderName }
  end

  Host->>Autofac: Build DI container (ConfigureServices)
  loop For each PluginDescriptor (alpha order)
    Autofac->>Autofac: Reflect assembly for IConsumer<T>, IWidgetPlugin, IPlugin, etc.
    Autofac->>DI: RegisterType<TConsumer>().As<IConsumer<TEvent>>()
    Autofac->>DI: RegisterType<TPlugin>().As<IPlugin>()
    Autofac->>DI: RegisterType<TWidget>().As<IWidgetPlugin>()
  end
  Note over DI: IConsumer<T> resolution order is now permanently fixed = folder alpha order

  Host->>Init: Call IPlugin.Initialize() for each active plugin (alpha order)
  Note over Init: LAW-4: IStoreContext NOT ready here. ISettingService returns null. Do NOT read settings here.
  Init-->>Host: void (no return, no async)

  Host->>Routes: Call IRouteProvider.RegisterRoutes(endpoints) for each plugin
  Routes->>Host: Plugin controller routes registered

  Note over Host: Startup complete. DI container sealed. Event dispatch order fixed.
```

---

## Plugin Folder Naming Convention

```
/Plugins/
  Nop.Plugin.A_EmailQueue/          ← Sorts first — handles email in event dispatch
  Nop.Plugin.Auth.AzureAD/          ← Azure AD SSO
  Nop.Plugin.Catalog.Inventory/     ← Stock management consumer
  Nop.Plugin.Integration.ERP/       ← ERP sync
  Nop.Plugin.Search.Elasticsearch/  ← Search indexing consumer
  Nop.Plugin.Tax.Avalara/           ← Avalara tax integration
  Nop.Plugin.Z_ERPIntegration/      ← Sorts last — runs after all other event consumers
```

**Governance rule (ADR-001)**: Plugins with ordering dependencies MUST use `[EventHandlerOrder(int)]` attribute AND prefix their folder with `A_` (first) or `Z_` (last). Unprefixed plugins execute in alpha position between `A_*` and `Z_*`.

---

## Critical Load Order Incidents

| Incident | Folder Change | Effect | Resolution |
|---|---|---|---|
| 2025-Q2: Missing ERP sync | `Nop.Plugin.Z_ERPIntegration` renamed to `Nop.Plugin.ERPIntegration` | Ran before EmailQueue — business logic assumed it ran last | Restored `Z_` prefix; ADR-001 written |
| 2024-Q4: Widget rendered twice | New plugin folder `Nop.Plugin.AAAWidget` inserted before `Nop.Plugin.A_EmailQueue` | Widget zone rendered same zone from both plugins | Renamed to `Nop.Plugin.Widgets.AAA` |
| 2025-Q1: Settings null on startup | Plugin read `ISettingService` in `Initialize()` | Returned null, caused NullReferenceException on first request | LAW-4 documented; settings moved to first request |
