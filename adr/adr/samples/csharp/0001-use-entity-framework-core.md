# ADR 0001: Use Entity Framework Core for Data Access

* Status: accepted
* Deciders: Architecture Committee
* Date: 2024-05-14

## Context and Problem Statement

Our C# application requires a robust ORM for interacting with SQL Server. We need a solution that integrates well with .NET Dependency Injection and provides migrations.

## Decision Drivers

* Integration with .NET ecosystem
* Migration support
* Developer familiarity

## Considered Options

* Entity Framework Core (EF Core)
* Dapper
* NHibernate

## Decision Outcome

Chosen option: "EF Core", because it is the standard .NET ORM with excellent tooling, migration support, and deep integration with ASP.NET Core.

### Consequences

* Good: High productivity with LINQ.
* Good: Built-in migration management.
* Bad: Overhead compared to micro-ORMs like Dapper for simple queries.
