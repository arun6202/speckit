# Design Doc: Distributed Job Processing Architecture

**System:** nopCommerce Core
**Updated:** 2026-05-22

## 1. Overview
This document outlines the modernized background job processing architecture for nopCommerce. To support cloud-native deployments, we have decoupled background execution from the main web process using an Event-Driven Architecture (EDA) powered by MassTransit.

## 2. Architectural Blueprint

Below is the high-level architecture comparing the Legacy pattern with the Modernized pattern.

```mermaid
graph TD
    subgraph "Legacy Brownfield (Pre-v5.0)"
        W1[Web Node 1] --> |Locks| DB[(SQL Server)]
        W1 -.-> |Executes| T1(Email Task)
        W1 -.-> |Executes| T2(Export Task)
        
        W2[Web Node 2] --> |Fails to Lock| DB
    end

    subgraph "Modernized (v5.0+)"
        WebAPI[nopCommerce Web Nodes] --> |Publishes Event| MT[MassTransit / RabbitMQ]
        
        MT --> |Consumes| Worker1[Worker Node A]
        MT --> |Consumes| Worker2[Worker Node B]
        
        Worker1 --> |Executes| T3(Email Consumer)
        Worker2 --> |Executes| T4(Export Consumer)
        
        Worker1 --> |Reads/Writes| DB2[(SQL Server)]
        Worker2 --> |Reads/Writes| DB2
    end
    
    classDef legacy fill:#ffebee,stroke:#c62828;
    classDef modern fill:#e8f5e9,stroke:#2e7d32;
    classDef broker fill:#e3f2fd,stroke:#1565c0;
    
    class W1,W2,T1,T2 legacy;
    class WebAPI,Worker1,Worker2,T3,T4 modern;
    class MT broker;
```

## 3. Core Components

### 3.1 `INopMessageBus` (The Abstraction)
We do not expose MassTransit directly to plugin developers. Instead, we provide `INopMessageBus`. This prevents tight coupling to a specific message broker framework.

```csharp
public interface INopMessageBus
{
    Task PublishAsync<T>(T message) where T : class;
}
```

### 3.2 The Deployment Topologies
Because nopCommerce supports everyone from small merchants to enterprise clusters, the architecture is polymorphic based on the `appsettings.json`:

1.  **Monolithic Mode (Default):**
    *   `"MessageBus": "InMemory"`
    *   Both Web and Worker run inside the same .NET process. No external RabbitMQ needed. Zero infrastructure changes for small users.
2.  **Distributed Mode (Enterprise):**
    *   `"MessageBus": "RabbitMQ"`
    *   Web nodes act as *Publishers*.
    *   Separate Docker containers run the *Worker* host.

## 4. The Bridging Strategy (Dealing with Legacy)
To prevent breaking 500+ existing plugins, we utilize an **Adapter Pattern**. 
The old `IScheduleTask` engine still exists, but instead of executing the task, it publishes a `LegacyTaskTriggeredEvent`. A generic MassTransit consumer picks this up and invokes the legacy code. This provides safety while logging a warning that the plugin is using deprecated APIs.

## 5. Observability
All MassTransit consumers are hooked into OpenTelemetry. Traces will flow from the HTTP Request (where the event was published) directly to the Worker node (where it was consumed), allowing full visibility in systems like Jaeger or Application Insights.
