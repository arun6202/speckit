# AI Workflow Specs

Source constraint: these workflow specs are produced from `info.md` only.

## Workflow 1: Brownfield Discovery to Markdown

Purpose: convert code and team knowledge into reviewable markdown.

Inputs:

- Existing code or documented source context
- Team assumptions
- Known pain points

Steps:

1. Identify the scope of discovery.
2. Ask an agent to summarize observed structure.
3. Capture assumptions separately from confirmed facts.
4. Produce markdown notes.
5. Add open questions and risks.

Outputs:

- Discovery notes
- Assumption log
- Open question list

Human review:

- Confirm that claims are source-grounded.
- Reject unsupported architecture conclusions.

## Workflow 2: Markdown to Diagram Set

Purpose: convert understanding into Mermaid, C4, and CLLA diagrams.

Inputs:

- Discovery notes
- Architecture notes
- Known actors, systems, and workflows

Steps:

1. Create a Mermaid flow for process or dependency understanding.
2. Create C4 context and container diagrams.
3. Create CLLA capability, logical, layer, and actor views.
4. Review diagrams against source notes.
5. Store diagram source with the markdown artifact.

Outputs:

- Mermaid diagrams
- C4 model
- CLLA model

Human review:

- Confirm that each diagram answers a useful question.
- Remove diagrams that are decorative or unsupported.

## Workflow 3: Agent Debate to Decision Record

Purpose: use agents and subagents to expose tradeoffs before adopting a pattern.

Inputs:

- Proposal
- Known constraints
- Existing artifacts

Steps:

1. Assign agent roles.
2. Run debate between adoption, architecture, engineering, and governance perspectives.
3. Summarize options and tradeoffs.
4. Select a recommendation.
5. Write a decision record.

Outputs:

- Debate transcript
- Tradeoff summary
- Decision record

Human review:

- Confirm the final decision is actionable.
- Add unresolved risks to the risk register.

## Workflow 4: Prompt to Skill Candidate

Purpose: convert repeated AI activity into a reusable skill candidate.

Inputs:

- Repeated prompt pattern
- Examples of successful use
- Quality expectations

Steps:

1. Define the workflow objective.
2. Specify required inputs.
3. Specify expected outputs.
4. Add guardrails and human review points.
5. Test the workflow across more than one use case.
6. Promote to skill candidate when stable.

Outputs:

- Workflow definition
- Skill candidate
- Review checklist

Human review:

- Confirm the workflow is repeatable.
- Confirm it is valuable enough to standardize.

## Workflow 5: Skill to GPT Gem

Purpose: package mature workflows as reusable GPT guidance.

Inputs:

- Stable workflow
- Guardrails
- Review checklist
- Example outputs

Steps:

1. Define the gem persona and responsibility.
2. Define when to use it.
3. Define outputs.
4. Define guardrails.
5. Add maintenance owner.

Outputs:

- GPT gem entry
- Usage guide
- Maintenance rule

Human review:

- Confirm the gem does not overreach.
- Confirm source traceability requirements are clear.

