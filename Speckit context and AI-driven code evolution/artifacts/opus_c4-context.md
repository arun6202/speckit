# C4 Context Diagram — nopCommerce Platform

**Target path in repo**: `/docs/architecture/context.md`  
**Verified**: 2026-05-16 by @arch-lead (against staging + production topology)  
**Status**: CURRENT  
**Next review due**: 2026-08-16  
**Source**: Generated from Claude Code discovery run on `/src`, verified against runtime HTTP traces

---

## System Context

```mermaid
C4Context
  title System Context — nopCommerce E-Commerce Platform

  Person(customer, "Customer", "Browses product catalog, places and tracks orders, manages account, wishlist, and returns. Authenticates via email/password or SSO.")
  Person(admin, "Store Administrator", "Manages products, categories, inventory, orders, promotions, tax rules, shipping methods, plugin configuration, and multi-store settings.")
  Person(pluginDev, "Plugin Developer", "Builds and deploys custom plugins extending catalog, payment, shipping, widgets, task scheduling, and third-party integrations.")

  System(nop, "nopCommerce Platform", "ASP.NET Core 8 multi-store e-commerce system. Plugin architecture via IPlugin interface. ~200 plugins (core + custom). Razor Pages storefront + admin panel. Redis caching. SQL Server persistence.")

  System_Ext(payGateway, "Payment Gateway", "Stripe / PayPal / Authorize.Net. Processes card-present and card-not-present transactions. PCI-DSS compliance boundary. Refund, void, and capture operations.")
  System_Ext(emailSvc, "Email Service", "SendGrid (primary) / SMTP relay (fallback). Transactional email: order confirmations, shipment notifications, password resets. Marketing campaigns via plugin.")
  System_Ext(cdn, "CDN", "Azure CDN. Serves product images, category thumbnails, theme CSS/JS, plugin-contributed static assets. Origin: Azure Blob Storage.")
  System_Ext(searchEngine, "Search Engine", "Elasticsearch 8. Receives product index updates on catalog changes. Serves search and autocomplete queries from storefront. Managed via Nop.Plugin.Search.Elasticsearch.")
  System_Ext(erp, "ERP / WMS", "SAP S/4HANA (partial integration). Inventory levels, purchase orders, fulfillment status. Sync via Nop.Plugin.Integration.ERP using REST webhooks. [PARTIALLY DOCUMENTED — see ADR-003]")
  System_Ext(taxSvc, "Tax Calculation Service", "Avalara AvaTax. Real-time tax calculation at checkout using customer shipping address + product tax category. [UNDOCUMENTED — found in discovery run 2026-05-16]")
  System_Ext(shipRateApi, "Shipping Rate APIs", "FedEx + UPS rate APIs. Real-time shipping rate estimates at checkout. Plugin-managed API credentials stored in ISettingService. Cached for 10 minutes per request hash.")
  System_Ext(ssoProvider, "SSO Provider", "Azure Active Directory. Admin panel authentication via OIDC. Customer SSO opt-in via OpenID Connect plugin. [UNDOCUMENTED — found in discovery run 2026-05-16]")
  System_Ext(monitoring, "Monitoring Stack", "Application Insights (traces + exceptions) + custom Datadog dashboard (business metrics: conversion rate, checkout funnel, plugin error rates). Alerting via PagerDuty.")
  System_Ext(claude, "Claude AI — Anthropic API", "Code generation, documentation authoring, SpecKit spec drafting, architecture review. Accessed via Claude Code CLI (development) and MCP servers (agent workflows). Models: Opus 4.7 (planning), Sonnet 4.6 (execution), Haiku 4.5 (fast drafts).")
  System_Ext(blobStorage, "Azure Blob Storage", "Product images, downloadable product files, PDF invoices, plugin asset uploads, theme overrides. CDN origin.")

  Rel(customer, nop, "Browses catalog, places orders, manages account", "HTTPS / 443")
  Rel(admin, nop, "Administers store via admin panel", "HTTPS / 443")
  Rel(pluginDev, nop, "Deploys plugins via assembly + plugin.json descriptor", ".NET assembly / IIS deploy")
  Rel(nop, payGateway, "Processes card charges, voids, and refunds", "HTTPS REST / PCI-DSS network zone")
  Rel(nop, emailSvc, "Sends transactional and marketing email", "SMTP / SendGrid REST API")
  Rel(nop, cdn, "Serves static assets via origin pull", "HTTPS")
  Rel(nop, searchEngine, "Indexes products on catalog change; queries on search request", "HTTPS REST / Elasticsearch API")
  Rel(nop, erp, "Syncs inventory levels; pushes confirmed orders for fulfillment", "HTTPS webhooks / batch sync")
  Rel(nop, taxSvc, "Calculates tax at checkout per line item and shipping", "HTTPS REST / Avalara API")
  Rel(nop, shipRateApi, "Fetches real-time shipping estimates", "HTTPS REST / carrier APIs")
  Rel(nop, ssoProvider, "Authenticates admin users via OIDC; customer SSO opt-in", "OIDC / OAuth 2.0")
  Rel(nop, monitoring, "Emits traces, exceptions, and business metrics", "OTLP / Application Insights SDK")
  Rel(nop, blobStorage, "Stores and retrieves binary assets", "Azure Blob SDK / HTTPS")
  Rel(claude, nop, "Reads source code, generates code and docs, drafts SpecKit specs", "Claude Code CLI / MCP servers")
```

---

## Discovery Notes (2026-05-16)

The following external systems were **not in the team's mental model** before the discovery run. They were found by scanning all `HttpClient` usages and external endpoint configurations in `/src`:

| System | Found in | Notes |
|---|---|---|
| Avalara AvaTax | `Nop.Plugin.Tax.Avalara/Services/AvaTaxManager.cs` | Called on every checkout. Timeout fallback uses estimated rate. |
| Azure AD SSO | `Nop.Plugin.Auth.AzureAD/Controllers/AuthController.cs` | Admin-only. Customers use local auth + optional OpenID plugin. |

Both are now included in this diagram and have been added to `FRESHNESS.md`.

---

## Boundary Clarifications

- **PCI-DSS boundary**: Payment Gateway is outside nopCommerce. No raw card data enters the platform. Only tokenized references from Stripe/PayPal SDK.
- **Claude AI boundary**: Claude reads code at development time and via MCP servers during agent workflows. Claude does **not** run in the production request path.
- **ERP sync is async**: Order push to ERP happens via a background `IScheduleTask`, not synchronously at order placement.
