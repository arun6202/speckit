# [Short title of the discovery]

*   **Status:** [Retroactive | Accepted]
*   **Archaeologist:** [Your Name]
*   **Date Discovered:** [YYYY-MM-DD]

## Context & Discovery
*Describe the situation that led to this discovery. What were you trying to do, and what "mystery" did you find?*

> Example: While refactoring the `OrderService`, I found that it doesn't use the standard `Entity Framework` context but instead uses a raw `SqlClient` connection with a hardcoded timeout of 300 seconds.

## The "Why" (Legacy Rationale)
*What was the likely reason for this decision at the time? (Business pressure, technical limitation, historical context).*

> Example: Based on git logs from 2017, this was added to handle a specific "Black Friday" load issue where the standard ORM was timing out on complex joins.

## Current Constraints
*Why can't we change it easily right now?*

> Example: The stored procedure called by this code relies on temp tables that are incompatible with the way our current EF Core configuration handles migrations.

## Consequences & Recommendations
*What should the next developer do when they encounter this?*

- **Do:** Keep the raw SQL for now if performance is critical.
- **Don't:** Attempt to port this to EF without a full regression test of the `Reports` module.
- **Future:** If we migrate to Service X, this entire block should be replaced by API Call Y.
