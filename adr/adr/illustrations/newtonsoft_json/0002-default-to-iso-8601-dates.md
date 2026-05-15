# ADR 0002: Default to ISO 8601 Date Format

* Status: accepted
* Deciders: James Newton-King
* Date: 2024-05-14 (Inferred from version 4.5 transition)

## Context and Problem Statement

Historically, .NET's `JavaScriptSerializer` used a non-standard JSON date format: `\/Date(1234567890)\/`. This format is difficult to read for humans and is not natively supported by most non-.NET platforms or JavaScript's `Date.parse()`. As Json.NET becomes a cross-platform standard, we need to decide on a default date serialization format that maximizes interoperability.

## Decision Drivers

* **Interoperability:** JSON should be easily consumable by Web Browsers (JavaScript), Java, Python, and other languages.
* **Readability:** The date format should be human-readable in its raw JSON form.
* **Standards Compliance:** Follow established web standards.

## Considered Options

1. **Microsoft Legacy Format:** `\/Date(ticks)\/`
2. **Unix Epoch (Seconds/Milliseconds):** `1234567890`
3. **ISO 8601:** `"2024-05-14T18:00:00Z"`

## Decision Outcome

Chosen option: **ISO 8601**, because it is the international standard for date and time representation. It is human-readable, preserves timezone information (optionally), and is natively supported by modern JavaScript engines and almost every modern programming language.

### Positive Consequences

* **Seamless Web Integration:** Web developers no longer need to write custom regex to parse dates coming from a .NET backend.
* **Standardization:** Aligns the .NET ecosystem with the broader web development community.

### Negative Consequences

* **Breaking Change:** Older clients expecting the `\/Date()\/` format will fail to parse the new string format.
* **String Parsing Cost:** ISO 8601 strings are slightly more expensive to parse than raw integer timestamps.

## Links

* [ISO 8601 Standard](https://en.wikipedia.org/wiki/ISO_8601)
* [Json.NET Dates Documentation](https://www.newtonsoft.com/json/help/html/DatesInJSON.htm)
