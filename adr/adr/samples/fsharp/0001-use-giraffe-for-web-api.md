# ADR 0001: Use Giraffe for Web API

* Status: accepted
* Deciders: F# Lead Developer
* Date: 2024-05-14

## Context and Problem Statement

For our F# project, we want a functional-first web framework that sits on top of ASP.NET Core but provides a more idiomatic F# experience (using combinators).

## Decision Drivers

* Functional programming style
* Performance (ASP.NET Core base)
* Compositional API

## Considered Options

* Giraffe
* Saturn
* ASP.NET Core MVC (C# style)

## Decision Outcome

Chosen option: "Giraffe", because it provides a lightweight, functional wrapper over ASP.NET Core that allows for high performance and easy composition of web handlers.

### Consequences

* Good: Idiomatic F# code.
* Good: Full access to the ASP.NET Core ecosystem.
* Bad: Steeper learning curve for developers coming from OO backgrounds.
