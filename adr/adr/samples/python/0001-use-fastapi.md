# ADR 0001: Use FastAPI for Web API

* Status: accepted
* Deciders: Backend Team
* Date: 2024-05-14

## Context and Problem Statement

We need a high-performance, easy-to-use web framework for our new Python microservices. The framework must support asynchronous programming and provide automatic OpenAPI documentation.

## Decision Drivers

* Performance (Asynchronous support)
* Developer productivity (Typing, auto-docs)
* Community support and ecosystem

## Considered Options

* Flask
* Django
* FastAPI

## Decision Outcome

Chosen option: "FastAPI", because it provides the best performance (benchmarks) and modern features like Pydantic integration and automatic Swagger UI.

### Consequences

* Good: Faster development with type hints.
* Good: High performance with `asyncio`.
* Bad: Relatively newer compared to Django/Flask.
