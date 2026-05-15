# ADR 0001: Use Contract-Based Serialization for Metadata Abstraction

* Status: accepted
* Deciders: James Newton-King
* Date: 2024-05-14 (Inferred from project history)

## Context and Problem Statement

Json.NET needs to support the serialization and deserialization of a vast array of .NET types (POCOs, Collections, Dictionaries, etc.). Performing reflection-based discovery of properties and attributes on every single serialization call is computationally expensive and leads to poor performance. Additionally, we need a way to allow users to customize how types are mapped to JSON without modifying the types themselves.

## Decision Drivers

* **Performance:** Minimize the overhead of reflection during runtime.
* **Extensibility:** Allow users to override property naming, visibility, and object creation.
* **Consistency:** Ensure that the same type is always handled the same way across different serialization calls.

## Considered Options

1. **Direct Reflection:** Reflect on the object every time it is serialized.
2. **Attribute-Only Mapping:** Only serialize properties marked with specific attributes (like `[DataContract]`).
3. **Contract-Based Mapping (with Caching):** Generate a "Contract" (metadata object) for each type once, and reuse it.

## Decision Outcome

Chosen option: **Contract-Based Mapping**, because it decouples the library from the underlying .NET type system. By introducing the `JsonContract` hierarchy and the `IContractResolver` interface, we can analyze a type once, determine exactly how it should be serialized (which properties, which names, which constructor), and cache this "Contract" for future use.

### Positive Consequences

* **Significant Performance Gains:** Subsequent serializations of the same type avoid reflection costs by fetching the contract from a concurrent cache.
* **Extreme Flexibility:** Users can implement a custom `IContractResolver` to implement global rules (e.g., camelCasing all properties) without adding attributes to every class.
* **Support for Non-Public Types:** Contracts can be configured to handle private setters or internal constructors.

### Negative Consequences

* **Memory Usage:** The cache of `JsonContract` objects grows with the number of unique types serialized.
* **Complexity:** Introducing an abstraction layer between reflection and serialization increases the internal complexity of the codebase.

## Pros and Cons of the Options

### Direct Reflection

* Good: Simple to implement.
* Bad: Slow; performance scales poorly with the number of objects.

### Attribute-Only Mapping

* Good: Very explicit and safe.
* Bad: Intrusive; requires users to modify their classes to work with the library.

## Links

* [Json.NET Documentation: IContractResolver](https://www.newtonsoft.com/json/help/html/ContractResolver.htm)
* [Performance Tips: Reuse Serializers](https://www.newtonsoft.com/json/help/html/Performance.htm)
