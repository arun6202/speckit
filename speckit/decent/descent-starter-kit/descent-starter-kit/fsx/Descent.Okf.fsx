// OKF emitter (SKELETON). Writes a conformant OKF concept (markdown + YAML frontmatter) into knowledge/.
// Pure string-building; the caller does the file write (effectful shell).
#load "Descent.Domain.fsx"
open Descent.Domain

type Concept =
    { Type: string; Title: string; Description: string
      Resource: string option; Tags: string list; Timestamp: string; Body: string }

/// Render a concept to OKF markdown. `type` is the only field OKF requires; we include the common set.
let render (c: Concept) : string =
    let line k v = sprintf "%s: %s" k v
    let resource = c.Resource |> Option.map (line "resource") |> Option.toList
    let header =
        [ "---"; line "type" c.Type; line "title" c.Title; line "description" c.Description ]
        @ resource
        @ [ sprintf "tags: [%s]" (String.concat ", " c.Tags); line "timestamp" c.Timestamp; "---"; "" ]
    String.concat "\n" (header @ [ c.Body ])

/// Build the lineage-field concept emitted when a ticket confirms an edge.
let lineageField (esField: string) (apiField: string) (oraTable: string) (oraCol: string)
                 (freshness: string) (ts: string) : string * Concept =
    let path = sprintf "knowledge/fields/%s.md" esField
    path,
    { Type = "Lineage Field"; Title = esField
      Description = sprintf "API '%s' <- ES '%s' <- Oracle %s.%s" apiField esField oraTable oraCol
      Resource = None; Tags = [ "lineage" ]; Timestamp = ts
      Body = sprintf "# Edge\n%s.%s -> %s (%s)\n" oraTable oraCol esField freshness }
// TODO: similar builders for Defect Pattern + Resolved Ticket; caller writes files + appends tickets/log.md.
