# Newtonsoft.Json (Json.NET) ADR Case Study

This directory contains **inferred** Architecture Decision Records based on the actual history and design of the `Newtonsoft.Json` library. 

### Why these examples?
`Newtonsoft.Json` is the most popular library in the .NET ecosystem. Its success is rooted in several key architectural decisions that prioritized **extensibility** and **performance** through abstraction.

### Included Illustrations:

1.  **[ADR 0001: Contract-Based Serialization](0001-contract-based-serialization.md)**
    *   **Focus:** Core Engine Design.
    *   **Lesson:** How to use an abstraction layer (Contracts) to solve performance bottlenecks (Reflection) while gaining flexibility.

2.  **[ADR 0002: Default to ISO 8601 Dates](0002-default-to-iso-8601-dates.md)**
    *   **Focus:** Ecosystem & Interoperability.
    *   **Lesson:** The importance of choosing industry standards over platform-specific legacy formats, even if it causes a breaking change.

### How to use this for your project:
Look at how these records capture the **"Why"**. They don't just say "we used ISO 8601," they explain the trade-offs regarding interoperability versus legacy support. This is the essence of a high-quality ADR.
