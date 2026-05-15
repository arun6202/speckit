# RFC 001: Modernizing Scheduled Tasks for Distributed Cloud Environments

**Status:** `Closed` (See ADR-002)
**Author:** Platform Architecture Team
**Date:** 2026-05-15
**Target Project:** nopCommerce

## 1. Problem Statement
Currently, nopCommerce handles background jobs (e.g., sending emails, clearing caches, processing recurring payments) via an in-process scheduled task runner (`IScheduleTask`). 

In a traditional single-server deployment, this works perfectly. However, as our enterprise clients move nopCommerce to Kubernetes (K8s) and auto-scaling Web Farms, this brownfield architecture causes severe issues:
1. **Resource Contention:** Heavy tasks (like catalog exports) consume CPU/Memory on the web nodes, degrading the customer shopping experience.
2. **Locking Issues:** To prevent a task from running on multiple pods simultaneously, the system relies on aggressive SQL Server distributed locks, causing database bottlenecks.
3. **Ephemeral Pods:** If a K8s pod is killed during a scale-down event, the in-process task dies with it, leading to silently failed background jobs.

## 2. Proposed Options

### Option A: Do Nothing (Status Quo)
Keep the `IScheduleTask` running on web nodes and rely on the database for locking.
*   **Pros:** Zero development cost. No new infrastructure.
*   **Cons:** Fails to support true cloud-native scaling; web performance continues to degrade during heavy task loads.

### Option B: Externalize to Hangfire
Replace the internal runner with Hangfire, pointing it to our existing SQL Server database.
*   **Pros:** Excellent dashboard; minimal infrastructure changes (uses existing SQL DB).
*   **Cons:** Hangfire polling can put significant load on SQL Server at high scale. 

### Option C: Distributed Message Bus (MassTransit + RabbitMQ)
Decouple task scheduling from execution. The web application only publishes an event (e.g., `ExportCatalogRequested`). Dedicated background worker services (consumers) pick up the message from RabbitMQ.
*   **Pros:** True decoupling; web nodes never do heavy lifting; RabbitMQ handles delivery guarantees (retries, dead-letter queues).
*   **Cons:** High architectural shift; requires standing up RabbitMQ infrastructure; steep learning curve for plugin developers.

## 3. Request for Feedback
We need the community and core maintainers to weigh in:
1. Are plugin developers ready to adopt a message-based architecture?
2. Is the infrastructure burden of RabbitMQ acceptable for mid-market users? 
3. Should we abstract the bus behind a new `INopMessageBus` interface to allow fallback to in-memory processing for small deployments?

*Please leave comments inline or in the associated GitHub Discussion #1042.*
