# Architecture Decision Records (ADR) - Research & Design

## 1. What is an ADR?
An **Architecture Decision Record (ADR)** is a short text file that captures an architecturally significant decision, its context, and its consequences. ADRs serve as a "why" log for a project, helping teams understand the rationale behind past choices.

### Key Benefits
- **Onboarding:** New developers can understand the "why" behind the system.
- **Decision Tracking:** Avoids "Groundhog Day" meetings by documenting trade-offs.
- **Knowledge Retention:** Preserves tribal knowledge when team members leave.
- **Alignment:** Provides a clear audit trail for stakeholders.

## 2. Industry Standard Templates

### Michael Nygard (The Classic)
The most popular and lightweight format. Focuses on Title, Status, Context, Decision, and Consequences.
- **Use case:** Small to medium teams wanting minimal overhead.

### MADR (Markdown Architectural Decision Records)
A more structured and comprehensive template. Includes decision drivers, considered options with pros/cons, and formal trade-off analysis.
- **Use case:** Complex decisions where multiple alternatives must be formally evaluated.

### Y-Statement
An ultra-minimal, one-sentence format:
*"In the context of **[use case]**, facing **[concern]**, we decided for **[option]** to achieve **[quality]**, accepting **[downside]**."*

## 3. Polyglot Samples

### Python
Python projects often use ADRs to manage evolving data science pipelines or web frameworks.
- **Example:** `pyadr` and `adr-viewer` tools use ADRs to manage their own internal architecture.

### C# (.NET)
The .NET community has strong adoption of ADRs, especially in Reactive and DDD-focused projects.
- **Example:** **Rx.NET** (Reactive Extensions) uses ADRs for major version transitions.

### F#
Functional programming projects use ADRs to document decisions around domain modeling and pure/impure boundaries.
- **Example:** **Scrum** (dzoukr) provides a real-world sample of ADR usage in an F# Onion Architecture.

## 4. Case Studies
- **Comcast:** Moved from a centralized "Architecture Review Board" to a collaborative "Architecture Guild" using ADRs.
- **GSA (18F):** Uses a public ADR repository to document decisions for government digital services.
- **Spotify:** Utilizes ADRs within their "Squad" model to maintain alignment across autonomous teams.

## 5. Recommended Tooling
- **adr-tools (Bash/Python):** Command-line tools to initialize and manage ADR logs.
- **dotnet-adr:** A .NET Global Tool for cross-platform ADR management.
- **Log4Brains:** Renders ADRs into a searchable, interactive web interface.
