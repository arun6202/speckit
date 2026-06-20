# knowledge/ — an Open Knowledge Format (OKF v0.1) bundle

This is the descent's **knowledge residue**, expressed as a conformant OKF bundle: a directory of markdown
files (concepts), each with YAML frontmatter, cross-linked into a graph. It is *just markdown, just files,
just frontmatter* — readable in any editor, renderable by the OKF static visualizer, ingestible by a
knowledge catalog, version-controlled next to the code.

Every resolved ticket **emits** into here (see the skill's close-the-loop step): a new/updated field
(lineage) concept, a defect-pattern concept if the pattern is new, and a resolved-ticket concept + a
`tickets/log.md` entry.

## Concept types used here
`API Endpoint` · `ES Index` · `Oracle Table` · `Kafka CDC Topic` · `Lineage Field` ·
`Runbook` · `Defect Pattern` · `Resolved Ticket` · `Glossary`

## Conventions
- File path = concept identity. One concept per file.
- `index.md` in each folder = progressive-disclosure entry point.
- `tickets/log.md` = chronological history.
- Concepts link with normal markdown links → that's the lineage/relationship graph.

## Relationship to your ODCS / ODPS / OpenLineage catalog
OKF is the **agent-and-human readable context** layer (meaning, joins, runbooks, defect lore — the stuff in
senior engineers' heads). ODCS/ODPS/OpenLineage are **machine-enforceable** contracts (schemas, SLAs,
validation, lineage events). They are complementary: an OKF concept `resource:` should LINK to the ODCS
contract / OpenLineage run, not duplicate it. Keep your structured catalog authoritative; OKF is the
narrative/interchange skin over it.
