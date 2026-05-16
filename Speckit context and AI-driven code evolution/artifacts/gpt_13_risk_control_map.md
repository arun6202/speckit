# GPT Risk Control Map

## Purpose

This diagram maps common AI adoption risks to controls.

```mermaid
flowchart TD
  R1["Risk: one-off prompt dependency"] --> C1["Control: workflow specs"]
  R2["Risk: unsupported architecture claims"] --> C2["Control: source grounding and C4 review"]
  R3["Risk: diagrams become decorative"] --> C3["Control: each diagram must answer a decision question"]
  R4["Risk: governance arrives late"] --> C4["Control: evidence packs for high-impact outputs"]
  R5["Risk: rewrite-first modernization"] --> C5["Control: migration subagent and incremental roadmap"]
  R6["Risk: poor patterns become standardized"] --> C6["Control: promote only proven workflows"]
  R7["Risk: documentation is not publishable"] --> C7["Control: markdown-first and Pandoc-ready structure"]
  R8["Risk: decisions lose context"] --> C8["Control: transcript logs and decision records"]

  C1 --> O["Outcome: governed enterprise AI reuse"]
  C2 --> O
  C3 --> O
  C4 --> O
  C5 --> O
  C6 --> O
  C7 --> O
  C8 --> O
```

## Control Checklist

- Does every high-impact output have source context?
- Does every major recommendation have a transcript?
- Does every accepted decision have a decision record?
- Does every repeated prompt have a workflow candidate?
- Does every mature workflow have an owner before becoming a skill or gem?

