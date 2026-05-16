# Opus Task Specification Template

**Target path in repo**: `/tasks/TEMPLATE.md`  
**Owner**: @arch-lead  
**Last updated**: 2026-05-16  
**Usage**: Opus (Planner) fills this out. Sonnet (Runner) reads this as the sole source of truth for a task.

---

## Template

```markdown
# Task: {Short imperative title}

**Spec ID**: TASK-{YYYYMMDD}-{NNN}  
**Authored by**: Opus 4.7 (Planner)  
**Date**: {YYYY-MM-DD}  
**Executing agent**: Sonnet 4.6 (Runner)  
**Review required**: {Yes — @arch-lead / No}  

---

## What to Build

{1-3 sentences. WHAT, not HOW. Sonnet decides HOW.}

## Acceptance Criteria

- [ ] {Specific, testable criterion 1}
- [ ] {Specific, testable criterion 2}
- [ ] {Specific, testable criterion 3}

## Scope

**In scope**:
- {File or component or behavior that is in scope}
- {Another in-scope item}

**Out of scope** (do NOT touch):
- {Specific thing that seems related but must not be changed}
- {Another out-of-scope item}
- {Any interface in Nop.Core unless explicitly listed as in-scope}

## Relevant CLAUDE.md Sections

{List the specific laws that apply to this task. Sonnet MUST read these before coding.}

- LAW-{N}: {Brief law name} — {why it applies to this task}
- LAW-{N}: {Brief law name} — {why it applies to this task}

## Applicable Skills

{List skill files Sonnet should read before implementing}

- `/skills/{skill-name}.md` — {why this skill applies}
- `/skills/{skill-name}.md` — {why this skill applies}

## Architectural Constraints

{Hard limits that must not be violated. These are pre-checked by Opus. If Sonnet discovers a new constraint, emit [ARCH-EXCEPTION].}

- {Constraint 1 — e.g., "No new DB migration — this task is code-only"}
- {Constraint 2 — e.g., "Must not change IOrderService interface"}
- {Constraint 3 — e.g., "Must pass existing integration tests in OrderServiceTests.cs"}

## Files to Modify

{Specific list. If Sonnet needs to touch files not listed here, emit [ARCH-EXCEPTION] first.}

| File | Change type | Notes |
|---|---|---|
| `{path/to/file.cs}` | Add / Modify / Delete | {What to change} |
| `{path/to/file.cs}` | Add / Modify / Delete | {What to change} |

## Files to Create (if any)

| File | Type | Notes |
|---|---|---|
| `{path/to/new-file.cs}` | C# class | {What it should contain} |

## Tests

{Describe what tests should exist or be modified. Sonnet must not skip this section.}

- **Unit test file**: `{path/to/tests.cs}`
- **Test to add**: `{TestMethodName}` — verifies {specific behavior}
- **Integration test**: {describe if applicable}
- **Existing tests to verify still pass**: {list or "all tests in {project}"}

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Applicable CLAUDE.md laws followed (verified by Sonnet self-check)
- [ ] Relevant skill patterns used (not reinvented)
- [ ] PR description references this task spec ID (TASK-{ID})
- [ ] No [ARCH-EXCEPTION] emitted — or if emitted, noted in PR for Opus review
- [ ] SpecKit spec updated if task touches a plugin with an existing spec

## [ARCH-EXCEPTION] Protocol

If Sonnet encounters any of the following during execution, STOP and emit:

```
[ARCH-EXCEPTION]
Task: TASK-{ID}
Issue: {describe what was found}
Impact: {what would need to change beyond this task's scope}
Recommendation: {what Sonnet thinks should happen}
Status: BLOCKED / CONTINUING WITH WORKAROUND
```

Triggers:
- Task would require modifying a Nop.Core interface
- Task would require a new DB migration not listed in scope
- Task would change an IConsumer<T> execution order
- Task would violate one of the 6 production laws
- Task scope is 2x larger than spec implies (discovered complexity)
```

---

## Worked Example

```markdown
# Task: Add loyalty points on OrderPlacedEvent

**Spec ID**: TASK-20260516-042  
**Authored by**: Opus 4.7 (Planner)  
**Date**: 2026-05-16  
**Executing agent**: Sonnet 4.6 (Runner)  
**Review required**: Yes — @senior-dev-1  

---

## What to Build

Add a new `IConsumer<OrderPlacedEvent>` handler in `Nop.Plugin.Loyalty` that awards loyalty points
to the customer when an order is placed. Points = floor(OrderTotal * 10). Points stored in
`LoyaltyPointsHistory` table (already exists).

## Acceptance Criteria

- [ ] Customer receives floor(OrderTotal * 10) points when order is placed
- [ ] Handler is idempotent: placing the same OrderId twice does not double-award points
- [ ] Handler failure (DB exception) does not prevent checkout from completing
- [ ] Points awarding logged as INFO: "Awarded {N} points to customer {CustomerId} for order {OrderId}"

## Scope

**In scope**:
- New class `LoyaltyOrderPlacedConsumer` in `Nop.Plugin.Loyalty/Infrastructure/`
- Update `Nop.Plugin.Loyalty/DependencyRegistrar.cs` if needed
- Update `/specs/order-placed-event.yaml` to add consumer to `current_consumers`

**Out of scope**:
- Do NOT change the points calculation formula (product of OrderTotal — ask if unclear)
- Do NOT add UI for viewing points (separate task)
- Do NOT modify `IOrderService`
- Do NOT change `LoyaltyPointsHistory` table schema

## Relevant CLAUDE.md Sections

- LAW-3: Event Handler Threading — handler must be `void`, not async Task; all work synchronous or enqueued
- LAW-2: StoreId Semantics — use Order.StoreId (not 0) when loading settings in handler

## Applicable Skills

- `/skills/plugin-event-consumer.md` — compliant handler template, [EventHandlerOrder] usage, background queue pattern

## Architectural Constraints

- No new DB migration — LoyaltyPointsHistory table already exists
- Must not change IOrderService or IConsumer<OrderPlacedEvent> interface
- Must pass existing LoyaltyPluginTests.cs integration tests

## Files to Modify

| File | Change type | Notes |
|---|---|---|
| `src/Plugins/Nop.Plugin.Loyalty/Infrastructure/LoyaltyOrderPlacedConsumer.cs` | Add | New file — create from skill template |
| `specs/order-placed-event.yaml` | Modify | Add LoyaltyOrderPlacedConsumer to current_consumers |

## Tests

- **Unit test file**: `tests/Nop.Plugin.Loyalty.Tests/LoyaltyOrderPlacedConsumerTests.cs`
- **Test to add**: `HandleEvent_AwardsCorrectPoints_WhenOrderPlaced` — verifies floor(OrderTotal * 10) points
- **Test to add**: `HandleEvent_IsIdempotent_WhenCalledTwiceForSameOrder` — verifies no double-award
- **Test to add**: `HandleEvent_LogsError_WhenDbException` — verifies exception is caught and logged
- **Existing tests to verify**: All tests in `Nop.Plugin.Loyalty.Tests`

## Definition of Done

- [ ] `LoyaltyOrderPlacedConsumer.HandleEvent` is `void`, has try/catch, logs error on failure
- [ ] Handler checks LoyaltyPointsHistory for existing record before inserting (idempotency)
- [ ] `[EventHandlerOrder(500)]` attribute present (no ordering dependency for loyalty)
- [ ] `/specs/order-placed-event.yaml` updated with new consumer entry
- [ ] All existing and new tests pass
- [ ] PR description references TASK-20260516-042
```
