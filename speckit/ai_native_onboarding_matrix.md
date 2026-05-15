# Practical AI-Native Onboarding Matrix
## Windsurf + Spec Kit + AI-Assisted Delivery

**Audience:** Managers, Product Owners, Developers, Testers, PL/SQL / Database Developers  
**Goal:** Move teams from shallow AI usage to disciplined, AI-native delivery.

---

## 1. Core principle

AI-native delivery does **not** mean:

```text
Everyone uses ChatGPT randomly.
```

It means:

```text
Clear intent
    ↓
Clear spec
    ↓
Controlled AI assistance
    ↓
Small changes
    ↓
Tests
    ↓
Review
    ↓
Governed delivery
```

AI should accelerate good engineering habits, not replace them.

---

## 2. Four knowledge levels

| Level | Meaning |
|---|---|
| Must know | Required for safe daily use |
| Should know | Strongly recommended for productivity and quality |
| Nice to know | Helpful for advanced usage |
| Optional | Useful for champions, architects, leads, and specialists |

---

## 3. Universal must-know for everyone

Everyone touching AI-assisted work should know these.

### Must know

- AI output is not truth.
- Fluent answer does not mean correct answer.
- Prompting is not enough; evaluation matters.
- Never paste secrets, credentials, production data, or private customer data.
- AI-generated code must be reviewed.
- AI-generated tests can be weak or self-confirming.
- Long context costs more and can confuse the model.
- AI agents can make multi-file mistakes quickly.
- Source control is mandatory before large AI changes.
- Human accountability does not disappear because AI produced the work.

### Shared vocabulary

Everyone should understand these at basic level:

- token
- prompt
- context window
- hallucination
- embedding
- RAG
- agent
- MCP
- eval
- temperature
- guardrail
- inference
- training
- model routing
- local model vs cloud model

---

## 4. Windsurf: minimum practical knowledge

Windsurf should be taught as an **agentic coding environment**, not just an editor.

### Must know

- Cascade has modes for asking/exploring and for making code changes.
- Code-changing mode must be used carefully.
- Ask Cascade to inspect first before editing.
- Ask for plan and touched files before multi-file changes.
- Review every diff.
- Run tests after changes.
- Commit before large changes.
- Do not blindly accept terminal commands.
- Do not paste secrets.
- Do not let hidden memories become project truth.

### Should know

- How to write project rules.
- How to use workflows for repeated tasks.
- How memories can help and how they can become stale.
- How to use MCP safely.
- How to reset or narrow context when Cascade drifts.
- How to ask for explanation of diffs.
- How to use AI for tests, refactoring, documentation, and code discovery.

### Nice to know

- How model selection affects coding behaviour.
- How prompt structure changes output quality.
- How to build team-level `.windsurfrules`.
- How to use AI for PR review preparation.
- How to use AI for migration planning.
- How to compare output from two models.

### Optional

- Building custom MCP servers.
- Deep prompt libraries.
- Local model integration.
- Advanced repo indexing strategies.
- Automated evals for coding-agent output.

---

## 5. Spec Kit / Spec-driven development: minimum practical knowledge

Spec Kit should be introduced as the antidote to uncontrolled vibe coding.

### Must know

- Spec first, code second.
- Product scenario must be clear before implementation.
- Acceptance criteria must be written.
- Non-functional requirements must be explicit.
- Constraints must be captured.
- AI should implement against the spec, not guess from vague prompts.
- Specs must live in the repo, not only in chat history.

### Should know

- How to write a feature spec.
- How to convert a feature into tasks.
- How to separate user intent from technical design.
- How to define edge cases.
- How to define testable acceptance criteria.
- How to update specs when requirements change.
- How to review AI output against the spec.

### Nice to know

- How Spec Kit works with AI coding agents.
- How to use slash-command style workflows.
- How to combine Spec Kit with Windsurf workflows.
- How to maintain architecture decision records.
- How to build reusable spec templates.

### Optional

- Creating organisation-wide spec templates.
- Custom SDD workflow automation.
- Spec linting.
- Linking specs to Jira/Azure DevOps.
- Traceability dashboards from spec → code → test → release.

---

## 6. Role matrix

## 6.1 Managers / Delivery Leads

### Must know

- AI increases speed but also increases review burden.
- More output does not equal more value.
- AI can create hidden technical debt quickly.
- Teams need time for review, testing, and cleanup.
- AI productivity must be measured after rework, not at first draft.
- Do not force “AI usage percentage” as a vanity KPI.
- Define what AI tools are allowed.
- Define what data must not be pasted into AI.
- Ensure code review remains mandatory.
- Ensure junior developers are not left alone with agentic tools.

### Should know

- Cost model: tokens, long context, retries, tool calls.
- Model tiers: small/medium/frontier.
- Cloud vs local trade-offs.
- AI governance and audit expectations.
- How to budget experimentation.
- How to measure cycle-time improvement realistically.
- How to spot fake AI productivity.

### Nice to know

- AI vendor evaluation.
- Data residency issues.
- Sovereign AI/local AI strategy.
- AI risk frameworks.
- Security review flow for MCP/tools.
- Model routing strategy.

### Optional

- Build-vs-buy analysis for internal AI platform.
- Enterprise agent governance model.
- AI operating model across business units.

### Manager questions to ask

```text
Was this AI output reviewed?
Did it reduce total delivery time or only typing time?
What risks increased?
What tests were added?
What is the rollback plan?
What data went into the model?
```

---

## 6.2 Product Owners

### Must know

- AI feature must start from user problem, not tool excitement.
- Acceptance criteria must be specific.
- AI outputs require quality thresholds.
- “Looks good” is not an acceptance test.
- Define fallback when AI is unsure.
- Define when human approval is required.
- Define source of truth for AI answers.
- Define cost per completed task.
- Define who is accountable when AI is wrong.
- Avoid vague user stories like “Add AI assistant.”

### Should know

- RAG basics.
- Hallucination risk.
- Prompt injection risk.
- Evaluation dataset creation.
- AI UX patterns: citations, confidence, feedback, regenerate, escalation.
- How to write AI-specific acceptance criteria.
- How to ask whether fine-tuning is really needed.
- How to distinguish demo quality from production quality.

### Nice to know

- Embeddings and vector search basics.
- Agent permission design.
- Temperature and model behaviour.
- Model comparison.
- AI analytics: usage, success rate, escalation, correction rate.
- Human-in-the-loop design.

### Optional

- Designing AI workflow experiments.
- Running AI product discovery workshops.
- Advanced eval design.
- Policy-as-product design.

### PO questions to ask

```text
What decision is AI influencing?
Which source proves the answer?
What is acceptable error rate?
What happens if answer is wrong?
What should AI refuse to do?
Where must human approval remain?
How do we measure usefulness?
```

---

## 6.3 Developers

### Must know

- Do not accept code you cannot explain.
- Always review AI diffs.
- Always run tests.
- Keep AI changes small.
- Use Git before large edits.
- Ask AI to inspect before modifying.
- Ask AI for plan before implementation.
- Do not expose secrets.
- Do not allow random dependencies.
- Understand the architecture before asking AI to change it.
- AI can hallucinate APIs and library behaviour.
- AI can introduce security bugs.

### Should know

- Windsurf rules.
- Windsurf workflows.
- Spec Kit flow: spec → plan → tasks → implementation.
- Test generation with review.
- Refactoring with constraints.
- Dependency review.
- Secure coding prompts.
- Debugging with logs and reproduction steps.
- How to ask AI for alternatives and trade-offs.
- How to use AI for codebase discovery.

### Nice to know

- Local models for private code experiments.
- Model comparison.
- Prompt templates for refactoring.
- AI-assisted migration planning.
- Architecture documentation generation.
- Using AI to generate ADR drafts.
- Static analysis + AI workflow.

### Optional

- Custom MCP tools.
- Agentic CI workflows.
- AI evals for generated code.
- Repo-level context optimization.
- Custom rules per framework/language.

### Developer prompts to use

```text
Read the relevant files first. Do not edit yet.
Explain the current implementation.
Then propose a plan.
List files you will touch.
Do not add dependencies without asking.
Add tests.
Keep the change minimal.
```

---

## 6.4 Testers / QA Engineers

### Must know

- AI can generate tests, but generated tests may be shallow.
- AI may test the happy path and miss edge cases.
- AI can invent expected behaviour if spec is unclear.
- Testers must challenge both the feature and the AI output.
- AI is useful for test ideas, not final test judgement.
- Production incidents can come from polished but untested AI code.
- Regression testing becomes more important when code changes accelerate.

### Should know

- How to ask AI for edge cases.
- How to derive test cases from specs.
- How to ask for negative tests.
- How to generate boundary tests.
- How to generate test data safely.
- How to test AI features for hallucination.
- How to test RAG answer groundedness.
- How to test permissions and data leakage.
- How to test agent workflows.
- How to create golden datasets.

### Nice to know

- AI eval frameworks.
- Mutation testing ideas.
- Prompt injection testing.
- Bias and safety testing.
- Non-deterministic testing strategies.
- Observability for AI products.
- Contract testing with AI-generated clients.

### Optional

- Automated AI regression harnesses.
- Red-teaming LLM workflows.
- Synthetic data generation strategy.
- Continuous eval pipelines.

### Tester questions to ask

```text
What is the source of truth?
What are the failure modes?
What should the AI never say?
What should the AI refuse?
Can user permissions be bypassed?
Can prompt injection change behaviour?
Does the same input produce acceptable variation?
```

---

## 6.5 PL/SQL / Database Developers

### Must know

- Never paste production data or credentials into AI tools.
- AI can write syntactically plausible but inefficient SQL.
- AI can miss indexing implications.
- AI can generate unsafe dynamic SQL.
- AI can misunderstand transaction boundaries.
- AI can produce queries that work on small data and fail at scale.
- Execution plan matters more than pretty query text.
- Data correctness is more important than generated code speed.
- AI-generated migration scripts require extreme review.
- Backup and rollback plan are mandatory.

### Should know

- How to ask AI to explain existing stored procedures.
- How to ask AI to produce test data without real customer data.
- How to ask AI to identify performance risks.
- How to ask AI to compare query alternatives.
- How to ask AI for indexing considerations.
- How to ask AI to generate unit tests for procedures.
- How to ask AI to document package/procedure purpose.
- How to use AI for impact analysis before schema changes.
- How to detect hallucinated table/column names.
- How to safely use AI for refactoring legacy SQL.

### Nice to know

- AI-assisted explain-plan interpretation.
- SQL anti-pattern detection.
- PL/SQL package documentation generation.
- Migration planning.
- Data lineage documentation.
- Synthetic data generation.
- Database security review prompts.

### Optional

- Local AI for sensitive DB code review.
- Internal schema-aware RAG.
- MCP connection to read-only database metadata.
- Automated stored procedure documentation pipelines.
- AI-assisted performance regression testing.

### PL/SQL prompts to use

```text
Explain this procedure step by step.
Do not rewrite yet.
Identify tables, joins, transactions, exceptions, and side effects.
List performance risks.
List data correctness risks.
Suggest tests before suggesting changes.
```

### PL/SQL red lines

Do not allow AI to casually change:

- production schema
- migration scripts
- grants/permissions
- triggers
- financial calculations
- audit logic
- exception handling
- transaction commits/rollbacks
- dynamic SQL
- data deletion/update scripts

---

## 7. AI-native onboarding plan

## Week 1: Shared foundation

### Audience

Everyone.

### Topics

- What AI can and cannot do
- Tokens, context, hallucination
- Cloud vs local
- Security basics
- AI output review discipline
- Vibe coding danger
- Spec-first mindset

### Outcome

Everyone knows the same vocabulary and risks.

---

## Week 2: Role-based practice

### Managers

- AI governance
- productivity measurement
- approval policy
- tool policy

### Product owners

- AI user stories
- acceptance criteria
- evals
- fallback and human approval

### Developers

- Windsurf workflow
- small diffs
- rules
- tests
- PR discipline

### Testers

- AI-generated test review
- edge cases
- golden datasets
- hallucination testing

### PL/SQL developers

- SQL review prompts
- performance risk
- migration safety
- schema/data privacy

---

## Week 3: Spec Kit adoption

### Activities

- Pick one small feature.
- Write spec.
- Write acceptance criteria.
- Write test plan.
- Use Windsurf to inspect code.
- Generate implementation plan.
- Implement small diff.
- Review and test.
- Record lessons.

### Output

One complete AI-assisted feature delivery cycle.

---

## Week 4: Production readiness

### Activities

- Define allowed use cases.
- Define forbidden data.
- Define tool permissions.
- Define review checklist.
- Define eval checklist.
- Define cost tracking.
- Define escalation path.
- Define AI incident process.

### Output

Team AI operating model.

---

## 8. Minimum AI-native operating rules

Use these as team policy.

```text
1. Spec before code.
2. Small AI diffs only.
3. Human review always.
4. Tests required.
5. No secrets in prompts.
6. No production data in prompts.
7. No blind terminal execution.
8. No blind dependency acceptance.
9. No agent tool access without permission design.
10. No production deployment without rollback.
```

---

## 9. Practical workflow: Spec Kit + Windsurf

```text
Product Owner writes problem + acceptance criteria
    ↓
Spec Kit structures the requirement
    ↓
Developer reviews spec
    ↓
Tester adds edge cases
    ↓
PL/SQL developer checks data impact
    ↓
Windsurf inspects repo
    ↓
Windsurf proposes plan
    ↓
Human approves scope
    ↓
Windsurf implements small diff
    ↓
Tests run
    ↓
Diff reviewed
    ↓
Security/performance checked
    ↓
PR merged
```

---

## 10. Done means AI-safe done

A feature is not done because AI generated it.

Done means:

- spec is clear
- acceptance criteria met
- tests pass
- AI output reviewed
- security checked
- performance acceptable
- data permissions respected
- rollback available
- documentation updated
- PO accepts based on evidence, not demo charm

---

## 11. The final message for teams

AI-native does not mean fast chaos.

AI-native means:

```text
More speed
with more discipline.
```

Bad teams will use AI to produce more garbage faster.

Good teams will use AI to compress boring work.

Great teams will use AI to improve thinking, specs, tests, documentation, and delivery governance.
