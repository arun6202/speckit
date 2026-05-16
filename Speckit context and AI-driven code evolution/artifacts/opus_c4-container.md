# C4 Container Diagram — nopCommerce Internal Architecture

**Target path in repo**: `/docs/architecture/container.md`  
**Verified**: 2026-05-16 by @arch-lead  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Source**: Discovery run + manual verification against IIS configuration and Redis keyspace scan

---

## Container Diagram

```mermaid
C4Container
  title Container Diagram — nopCommerce Internal Architecture

  Person(customer, "Customer")
  Person(admin, "Store Administrator")

  System_Boundary(nopBoundary, "nopCommerce Platform") {

    Container(webApp, "Storefront + Admin Panel", "ASP.NET Core 8 — MVC + Razor Pages", "Handles all HTTP requests. Multi-store routing via IStoreContext. Theming engine loads Razor views from plugin assemblies. Areas: Admin, Storefront. IIS / Azure App Service hosted.")

    Container(pluginEngine, "Plugin Engine", "Nop.Core + Nop.Web.Framework", "Discovers plugins by scanning /Plugins/ directories. Validates plugin.json descriptor (SystemName, Version, DependsOn). Registers plugin services into Autofac DI container. IWidgetPlugin renders widgets into view zones. IExternalAuthenticationMethod handles OAuth. Plugin load order is alphabetical by folder name — this is a documented constraint (see ADR-001).")

    Container(domainServices, "Domain Services Layer", "Nop.Services — 24 service namespaces", "IProductService, IOrderService, ICustomerService, IDiscountService, IShippingService, ITaxService, IWorkflowMessageService, etc. All business logic. Cache-aware via IStaticCacheManager. Services are the only sanctioned callers of IRepository<T>. Plugins may consume but must not bypass.")

    Container(dataLayer, "Data Access Layer", "Nop.Data — Entity Framework Core 8", "IRepository<T> generic pattern wrapping DbContext. SQL Server provider. Code-first migrations prefixed Nop_*_Migration. All tables carry Nop_ prefix. Multi-store isolation via StoreId column. Soft-delete via Deleted column. Entity change notifications feed cache invalidation.")

    Container(cacheLayer, "Distributed Cache", "Redis 6 — IStaticCacheManager + ILocker", "Cache-aside pattern. CacheKey objects combine prefix + version + store-scoped parameters. ILocker implements distributed locking for single-write-multi-read scenarios. Per-store cache isolation requires StoreId in every cache key. NODE-LOCAL vs REDIS-WIDE invalidation behaviour depends on deployment topology — see LAW-1 in CLAUDE.md.")

    Container(bgScheduler, "Background Task Scheduler", "Nop.Services.Tasks — IScheduleTask + Hangfire", "IScheduleTask implementations: product index rebuild, email queue flush, sitemap generation, currency rate sync, abandoned cart notification, ERP batch sync, database log cleanup. Hangfire dashboard at /admin/hangfire (admin-only). Tasks run on configurable cron intervals stored in ScheduleTask table.")

    Container(pluginSettings, "Plugin Settings Store", "SQL Server Setting table + Redis cache layer", "ISettingService reads/writes Setting table (Name, Value, StoreId). StoreId=0 means global; StoreId=N means store-specific override. Settings cached in Redis on first read; invalidated on admin save. CRITICAL: read timing constraint — settings unavailable in Plugin.Initialize() because IStoreContext is not yet initialised at that point (see LAW-4 in CLAUDE.md).")

    Container(db, "SQL Server 2019", "Relational Database — primary persistence", "Single database. Multi-tenant via StoreId on ~60% of tables. ~180 tables with Nop_ prefix. Full-text index on Product.Name + Product.ShortDescription for search fallback. Encrypted columns: PaymentToken, CustomerPassword (hashed). Read replicas: not currently configured. Backup: daily full + hourly differential to Azure Blob.")

    Container(redisCache, "Redis 6", "Distributed Cache + Session Store + Distributed Lock", "Cache keys follow pattern: nop.{prefix}.{version}.{params}. TTL varies: product cache 60min, setting cache 60min, cart cache 5min, search results 10min. Session storage: ASP.NET Core distributed session. ILocker uses SETNX + expiry for distributed locking. Keyspace: ~15,000 keys at peak load.")

    Container(fileStorage, "Azure Blob Storage", "Binary Asset Store", "Containers: nop-pictures (product/category images), nop-downloads (downloadable products), nop-invoices (PDF invoices), nop-thumbs (generated thumbnails). IPictureService handles picture CRUD + thumbnail generation. IDownloadService handles downloadable product binary delivery. Plugin uploads land in nop-plugin-uploads.")

    Container(emailQueue, "Email Queue", "QueuedEmail table + background flush task", "IQueuedEmailService enqueues emails to QueuedEmail SQL table. IScheduleTask (SendEmailsTask) runs every 5 minutes, dequeues, sends via ISmtpBuilder. Retry on failure up to MaxNumberOfTries. Failed emails land in FailedEmail log. Decouples email sending from request thread — critical for event handler threading (see LAW-3 in CLAUDE.md).")
  }

  Rel(customer, webApp, "HTTP requests — storefront pages", "HTTPS 443")
  Rel(admin, webApp, "HTTP requests — admin panel", "HTTPS 443")
  Rel(webApp, pluginEngine, "Routes requests to plugin controllers; renders plugin widgets in view zones")
  Rel(webApp, domainServices, "Direct service calls for core page data")
  Rel(pluginEngine, domainServices, "Plugin services consume domain services via DI")
  Rel(domainServices, dataLayer, "Repository reads and writes")
  Rel(domainServices, cacheLayer, "Cache-aside reads and writes", "Redis protocol 6379")
  Rel(domainServices, pluginSettings, "Reads plugin configuration via ISettingService")
  Rel(domainServices, emailQueue, "Enqueues email notifications via IQueuedEmailService")
  Rel(dataLayer, db, "SQL queries via Entity Framework Core", "TCP 1433")
  Rel(cacheLayer, redisCache, "All cache operations", "Redis protocol 6379")
  Rel(bgScheduler, domainServices, "Scheduled task invocations via IScheduleTask")
  Rel(bgScheduler, emailQueue, "Email flush task drains queue every 5 min")
  Rel(domainServices, fileStorage, "Binary asset reads and writes via IPictureService / IDownloadService")
  Rel(pluginSettings, db, "Setting table reads and writes")
  Rel(pluginSettings, redisCache, "Setting cache reads and writes")
```

---

## Critical Constraints (sourced from incident history)

### Cache Isolation (LAW-1)
`IStaticCacheManager.RemoveByPrefix()` behaviour differs by deployment:
- **Single-server**: removes from in-memory cache only (this node)
- **Multi-server (Redis)**: removes cluster-wide

Always assume multi-server. Use `RemoveAsync(specificKey)` for targeted invalidation. Never assume a prefix sweep is safe without confirming deployment topology.

### Settings Read Timing (LAW-4)
Plugin `Initialize()` is called during app startup **before** `IStoreContext` is initialised. Any `ISettingService.GetSettingByKey()` call in `Initialize()` returns `null` silently — no exception. Settings must be read lazily (first request handler) or via constructor injection after startup completes.

### Plugin Load Order
Plugins load alphabetically by folder name (`/Plugins/Nop.Plugin.A/` before `/Plugins/Nop.Plugin.B/`). This affects:
- DI registration order
- `IConsumer<T>` event handler execution order
- Widget rendering order when multiple plugins target the same zone

See ADR-001 for the formal decision on making this order explicit via `[EventHandlerOrder]` attribute.

---

## Deployment Topology (current)

```
Azure App Service Plan (P2v3)
  └─ 2 instances (auto-scale 2–4 on CPU >70%)
  └─ Shared Redis (Azure Cache for Redis — Standard C2)
  └─ SQL Server (Azure SQL Database — Business Critical tier)
  └─ Azure Blob Storage (LRS, hot tier)
  └─ Application Insights workspace
```

The 2-instance deployment means **all cache invalidation must assume multi-server**. This is LAW-1. Any single-server assumption will work in local development and fail silently in production.
