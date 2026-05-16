# AI Adoption Risk Register

Source constraint: this risk register is produced from `info.md` only.

| ID | Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| R1 | Teams rely on one-off prompts that cannot be repeated | Knowledge stays local and inconsistent | Convert repeated prompts into workflow specs | Engineering Enablement |
| R2 | AI-generated architecture drifts away from actual code | Wrong modernization decisions | Require source grounding and human review | Enterprise Architect |
| R3 | Adoption moves faster than governance | Security and production risks increase | Use evidence packs and review checkpoints | Governance Subagent |
| R4 | Diagrams become decorative instead of useful | Teams lose trust in artifacts | Require each diagram to answer a real question | Documentation Subagent |
| R5 | Brownfield work becomes rewrite-first | Risk, cost, and delivery disruption rise | Prefer incremental discovery, tests, and refactoring | Migration Subagent |
| R6 | Documentation is not publishable | Knowledge remains fragmented | Use markdown-first structure and Pandoc publishing path | Documentation Subagent |
| R7 | Skills and gems are created too early | Poor practices become standardized | Promote only proven workflows | Engineering Enablement |
| R8 | Agent debates are not logged | Decisions lose reasoning context | Store all transcripts in markdown | Change Lead |

## Review Cadence

Review this register at the end of each adoption phase:

1. Minimal AI use
2. Structured brownfield understanding
3. Workflow conversion
4. Skills and enterprise patterns
5. Governed enterprise reuse

