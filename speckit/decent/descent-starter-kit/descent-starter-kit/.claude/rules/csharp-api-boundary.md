# Rule: the C# Web API boundary (⚠️ un-disciplined zone)

The C# Web API is **survival-income** code: controllers, DTO classes, exception filters, nullable refs.
It is **read-only intelligence** for troubleshooting, never a pattern to import.

- The ONLY F# function allowed to read C# is `lineage` (the lineage probe). Its sole job is to convert
  the C# query builder + OpenAPI into immutable `LineageEdge` values and the known-good `EsId`.
- Nothing class-shaped, nullable, or exception-based may escape that function into the F# descent.
- Mark every place you cross this boundary with ⚠️ in code and notes.
- When reading the API: you want (a) API param → ES query mapping, (b) ES field → response field mapping,
  (c) how the ES `_id` / business key is constructed (must match the ETL fsproj's construction).
