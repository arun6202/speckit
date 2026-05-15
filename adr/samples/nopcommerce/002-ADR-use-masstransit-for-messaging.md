# ADR 002: Adopt MassTransit & RabbitMQ for Distributed Task Processing

*   **Status:** Accepted (Resolves RFC 001)
*   **Date:** 2026-05-20
*   **Context:** nopCommerce Brownfield Modernization

## Context
As discussed in RFC-001, nopCommerce's legacy in-process `IScheduleTask` runner is causing CPU starvation on web nodes and database locking contention in clustered/Kubernetes environments. We must decouple web request handling from heavy background processing.

Because nopCommerce is a deeply extensible brownfield project with hundreds of third-party plugins, whatever solution we choose must be abstractable so we don't break the entire plugin ecosystem overnight.

## Decision
We will adopt **MassTransit** as our abstraction layer for message-based distributed processing, with **RabbitMQ** as the default production transport.

To support our massive legacy user base who run nopCommerce on single servers (e.g., shared hosting), we will implement an **In-Memory Transport fallback**. 

1. We will introduce `INopMessageBus`.
2. For single-node deployments, `INopMessageBus` will route to MassTransit's In-Memory bus.
3. For enterprise/cloud deployments, configuration can switch the bus to RabbitMQ.
4. Legacy `IScheduleTask` implementations will be marked `[Obsolete]` but will be wrapped in a bridging consumer for 2 major versions.

## Consequences

### Positive
*   **Web Node Relief:** Web pods in K8s will solely handle HTTP traffic, drastically improving storefront latency.
*   **Reliability:** Failed jobs will now route to Dead Letter Queues (DLQs) automatically via RabbitMQ.
*   **True Scalability:** We can scale "Worker" pods independently from "Web" pods.

### Negative
*   **Infrastructure Overhead:** Enterprise users must now provision and monitor RabbitMQ.
*   **Eventual Consistency:** Developers must adapt to eventual consistency. An order placed is no longer *guaranteed* to have its confirmation email sent in the exact same HTTP request pipeline.
*   **Plugin Migration:** Plugin vendors have a 2-year window to migrate legacy tasks to MassTransit Consumers.
