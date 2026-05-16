---
phase: P1
title: "Markdown-First Documentation"
weeks: "3–5"
session_id: "debate-p1-nopcommerce-20260516"
agents:
  - id: OPUS-ARCH
    model: claude-opus-4-7
    role: Architect Planner
  - id: SONNET-RUN
    model: claude-sonnet-4-6
    role: Execution Runner
  - id: HAIKU-OPS
    model: claude-haiku-4-5
    role: Ops Observer
moderator: "Claude Code Operator"
verdict:
  - "Runbooks first (Week 3) — highest ops ROI"
  - "ADRs in Week 4 using lightweight Nygard format — Claude auto-proposes from PR discussions"
  - "Pandoc pipeline: CI renders MD → PDF/DOCX on tag push only (not every commit)"
  - "RFC template for decisions affecting >2 plugins or >1 external system boundary"
  - "Confluence migration: read-only archive, no new content after Week 3"
---

# Phase 1: Markdown-First Documentation — Agent Debate Transcript

**Session**: 2026-05-23T09:00:00Z  
**Input from P0**: `/docs/architecture/` populated with 5 verified diagrams; 2 undocumented integrations revealed  
**Team context**: Confluence wiki has ~400 pages; ~90 relevant; ~40 still accurate; ~10 actively maintained

---

## Pre-Session Brief

Phase 0 produced ground-truth diagrams. Phase 1 must establish the document infrastructure that Claude can maintain going forward. The risk: selecting formats and workflows that developers won't use, producing another wiki that silently rots.

The key question: what is the minimal viable documentation system that Claude can co-author, that Pandoc can render into enterprise deliverables, and that developers will actually maintain?

---

## Turn 1 — OPUS-ARCH [Opening Position]

Documentation has one invariant that teams consistently violate: **a decision not recorded is a decision that will be relitigated**. Every ADR skipped is a 2-hour meeting that will happen again in 6 months when the original deciders have left or forgotten.

My structure for Phase 1:

**ADRs (Architecture Decision Records)** are mandatory for any decision that:
- Changes a cross-plugin contract (event names, DI registration patterns, cache key formats)
- Modifies a database migration strategy
- Adds or removes an external system dependency
- Establishes a pattern that other plugins will follow

Format: **Michael Nygard lightweight ADR** — Context, Decision, Consequences. Three sections. One page max. This is non-negotiable; longer formats do not get written.

**RFCs** (Request For Comments) for decisions requiring pre-implementation discussion:
- Threshold: decisions affecting >2 plugins or touching an external system boundary
- Process: RFC merged as PROPOSED, implemented as ACCEPTED, superseded as DEPRECATED

**Pandoc pipeline** for enterprise format delivery:
- All docs in Markdown with YAML frontmatter (author, date, status, tags)
- Pandoc compiles to PDF (management reports), DOCX (client deliverables), HTML (internal wiki)
- Triggered on Git tags — not every commit

Week 3: ADR template + 10 retrospective ADRs for the 10 most consequential past decisions.
Week 4: Pandoc pipeline established + Confluence read-only archived.
Week 5: First 5 runbooks migrated + RFC template deployed.

---

## Turn 2 — SONNET-RUN [Pragmatic Challenge]

I strongly disagree on ADRs first. Three reasons:

**1. Retrospective ADRs are fiction.** Writing an ADR 3 years after the decision means writing from incomplete memory, survivor bias (only winners remember their reasoning), and no ability to validate the "Consequences" section against actual outcomes. They have the form of ADRs but none of the epistemic value.

**2. The team won't write ADRs without a trigger.** ADR tools require developers to remember to write ADRs. In a team where 3 of 5 people are skeptical of process overhead, "remember to write an ADR" is a rule that lasts until the second sprint. The only ADR system that survives is one that runs automatically.

My proposal: **Claude Code hook on PR creation** — reads PR description and diff, identifies patterns matching "we decided X because Y" or "chose X over Y", proposes a draft ADR as a PR comment. The developer reviews and approves or dismisses. ADR creation becomes a review step, not a creative task.

**3. Runbooks first.** Runbooks have immediate ops value. An ADR about why we chose Redis over Memcached is worth nothing at 2am. A runbook that says "Plugin settings not loading? Run `EXEC sp_nopClearSettings @storeId=0` and restart the app pool" is worth everything. Start where the ROI is highest: operational procedures.

My Week 3 target: 15 runbooks for the 15 most common ops procedures, auto-drafted by Claude from incident history and Slack search.

---

## Turn 3 — HAIKU-OPS [Stability Concern]

SONNET-RUN is correct: runbooks first. I have an ops night shift log of the 23 most frequently executed manual procedures. None of them are documented. Eight of them have been executed incorrectly at least once, causing extended incidents.

But I have a structural concern about the ADR-from-PR-hook approach: **it generates noise before it generates signal**. If the hook fires on every PR that mentions a decision, developers will see 5 draft ADR proposals per week, dismiss most of them as irrelevant, and develop a habit of dismissing all of them. The hook must be tuned to fire rarely and precisely.

My proposal for ADR trigger precision: the hook only fires when the PR diff includes changes to:
- A plugin's `ServiceRegistration.cs` or DI configuration
- A database migration file (`*_Migration.cs`)  
- A new plugin's `plugin.json` descriptor
- Any change to `appsettings.json` or `web.config` that adds an external endpoint

These are the structural changes that warrant ADRs. Style changes, bug fixes, and feature additions typically do not.

Additionally: **Pandoc pipeline must not generate DOCX by default.** Track-changes and comment handling in Word is a governance nightmare. DOCX on-demand only, with explicit `--reference-doc` to maintain corporate template.

---

## Turn 4 — OPUS-ARCH [Rebuttal + Integration]

SONNET-RUN and HAIKU-OPS have convinced me on sequencing. Runbooks first — I concede this.

On retrospective ADRs: I revise my position. Do not write retrospective ADRs from memory. Instead, prompt Claude with the P0 discovery report and git log to identify structural decisions that are already visible in the code:

```
Claude Code prompt:
"Read the /Plugins/ directory. For each plugin, identify:
1. DI registration patterns that differ from the core pattern in Nop.Web.Framework
2. Database tables that don't follow the Nop_ prefix convention
3. IConsumer<T> handlers that call services outside their plugin boundary
Output as: plugin | deviation | likely-reason | recommend-adr(yes/no)"
```

This generates ADR candidates from evidence, not memory. The developer adds the business context; Claude provides the technical observation.

On Pandoc: HAIKU-OPS is correct about DOCX. Revised pipeline:
- `make docs` → HTML only (fast, local preview)
- `make docs-pdf` → PDF via Pandoc (CI on tag push)
- `make docs-docx` → DOCX with corporate reference template (on-demand only, never automated)

---

## Turn 5 — SONNET-RUN [Acceptance + Claude Integration Detail]

Accepted. On the Claude Code hook for ADR proposals — here's the precise implementation:

```yaml
# .claude/hooks/pr-adr-check.yml
trigger: pull_request.opened || pull_request.synchronize
files_changed:
  - "**/ServiceRegistration.cs"
  - "**/*_Migration.cs"
  - "**/plugin.json"
  - "appsettings*.json"
prompt: |
  Review this PR diff. If the changes establish a new architectural pattern or
  deviate from an existing one documented in /docs/adr/, propose a draft ADR
  using the template at /docs/adr/TEMPLATE.md. Output the draft ADR as a
  GitHub PR comment prefixed with [ADR-PROPOSAL]. If no ADR is warranted,
  output: [ADR-PROPOSAL: none — change is implementation, not architecture].
```

This gives developers a binary response on every structural PR: either a draft ADR to review, or an explicit "no ADR needed" signal. No ambiguity, no remembered process.

---

## Turn 6 — HAIKU-OPS [Risk Sign-off]

Accepted on all counts. One ops addition: **runbook validation must be part of the runbook format**.

Every runbook must include:
```markdown
## Validation Steps
- [ ] Step X completed when: [observable outcome]
- [ ] Step Y completed when: [log message / UI state / query result]

## Rollback
If any validation step fails: [specific rollback procedure]
```

A runbook without validation steps is a script without error handling. It tells you what to do but not whether it worked.

---

## Resolution

**Agreed sequence:**
- **Week 3**: 15 runbooks (Claude-drafted from incident log + Slack history) with validation steps
- **Week 4**: ADR template + Claude Code PR hook + 5 evidence-based ADRs from discovery report
- **Week 5**: Pandoc pipeline (HTML default, PDF on tag, DOCX on-demand) + RFC template + Confluence read-only

---

## Artifacts Produced

### Artifact 1 — ADR Template

```markdown
# ADR-NNN: [Decision Title]

**Date**: YYYY-MM-DD  
**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]  
**Deciders**: [names or roles]  
**Context tags**: [plugin | database | external-api | caching | events | security]

## Context

[What is the situation? What forces are at play? What makes this decision necessary?
1-3 paragraphs. No jargon. Someone who joined the team today must understand it.]

## Decision

[What did we decide? State it as an active sentence: "We will use X" not "X was chosen."]

## Consequences

**Positive:**
- [Direct benefit 1]
- [Direct benefit 2]

**Negative / Trade-offs:**
- [What we give up or accept as a cost]
- [Known risks]

**Neutral (things that change):**
- [Downstream effects that are neither clearly good nor bad]

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Option A | [Reason] |
| Option B | [Reason] |

## Implementation Notes

[If relevant: what must be done to implement this decision? Links to PRs, migrations, or runbooks.]
```

### Artifact 2 — Runbook Template

```markdown
# Runbook: [Procedure Name]

**System**: nopCommerce [module]  
**Severity trigger**: [P1/P2/P3 — when to run this]  
**Last validated**: YYYY-MM-DD by @[engineer]  
**Estimated duration**: [X minutes]  
**Requires**: [access level, VPN, SQL access, etc.]

---

## Symptoms

- [Observable symptom in monitoring / customer report / error log]
- [Second observable symptom]

## Diagnosis

```sql
-- Query to confirm this is the right runbook
SELECT [diagnostic query]
```

Expected output if this runbook applies: [describe expected result]

## Procedure

### Step 1: [Name]
```
[exact command or UI steps]
```
**Completed when**: [log message / SQL result / UI state that confirms success]

### Step 2: [Name]
```
[exact command or SQL]
```
**Completed when**: [observable outcome]

## Validation

- [ ] [Check 1 — with expected value]
- [ ] [Check 2]
- [ ] Notify [#channel] that procedure is complete

## Rollback

If Step [N] fails or validation fails:
```
[Exact rollback procedure]
```

## Post-Procedure

- [ ] Update FRESHNESS.md in /docs/runbooks/ with today's date
- [ ] If procedure has changed: update this runbook and open PR
- [ ] If new symptoms encountered: add to Symptoms section
```

### Artifact 3 — Sample Runbook: Plugin Settings Not Loading

```markdown
# Runbook: Plugin Settings Not Loading After Deployment

**System**: nopCommerce Plugin Configuration  
**Severity trigger**: P2 — Plugin settings returning null/default after deployment or config change  
**Last validated**: 2026-05-23 by @ops-lead  
**Estimated duration**: 5 minutes  
**Requires**: SQL Server access, IIS/Azure App Service access

---

## Symptoms

- Plugin configuration page shows empty fields after values were saved
- Plugin behavior reverts to defaults (e.g., payment plugin ignores API key setting)
- Log contains: `NopException: Setting 'PluginName.Setting' not found for store 0`

## Diagnosis

```sql
-- Confirm settings exist in DB
SELECT * FROM Setting 
WHERE Name LIKE 'PluginName.%' 
ORDER BY StoreId, Name;

-- Check if Redis has stale cache
-- (Run from Redis CLI or Azure Cache console)
-- KEYS setting:*
-- If output is large (>1000 keys) AND settings exist in SQL, cache is stale
```

## Procedure

### Step 1: Clear settings cache from admin panel
Navigate to: **Admin → System → Caches → Clear cache**  
Then: **Admin → System → Restart application**  
**Completed when**: Admin panel loads without error after restart

### Step 2: If Step 1 doesn't resolve — force Redis flush for settings prefix
```bash
# Redis CLI (or Azure Cache console)
redis-cli --scan --pattern "setting:*" | xargs redis-cli DEL
```
**Completed when**: `redis-cli KEYS setting:*` returns empty

### Step 3: If settings missing from SQL — re-save from plugin config page
Navigate to: **Admin → Configuration → Plugins → [Plugin Name] → Configure**  
Re-enter all settings and click Save.  
**Completed when**: `SELECT COUNT(*) FROM Setting WHERE Name LIKE 'PluginName.%'` > 0

## Validation

- [ ] Navigate to plugin's storefront feature — confirm it behaves correctly
- [ ] Check Application Insights for `NopException: Setting` errors — confirm 0 in last 5 min
- [ ] Confirm `Setting` table row count hasn't decreased unexpectedly

## Rollback

None applicable — this runbook only reads and writes to expected locations.

## Post-Procedure

- [ ] If this happened after deployment: add post-deployment step to deployment runbook
- [ ] Update FRESHNESS.md with today's date
- [ ] If Redis flush was needed: open ticket to investigate why settings cache wasn't invalidated on deployment
```

### Artifact 4 — Pandoc Pipeline Configuration

```makefile
# Makefile — Documentation Build Pipeline

DOCS_DIR     := docs
OUT_DIR      := dist/docs
PANDOC_FLAGS := --standalone --table-of-contents --number-sections
PDF_FLAGS    := $(PANDOC_FLAGS) --pdf-engine=xelatex -V geometry:margin=1in
DOCX_FLAGS   := $(PANDOC_FLAGS) --reference-doc=templates/corporate.docx

.PHONY: docs docs-pdf docs-docx docs-clean

# Fast local preview — HTML only
docs:
	@mkdir -p $(OUT_DIR)/html
	@for f in $(DOCS_DIR)/**/*.md; do \
		pandoc $$f $(PANDOC_FLAGS) -o $(OUT_DIR)/html/$$(basename $$f .md).html; \
	done
	@echo "Docs built → $(OUT_DIR)/html/"

# PDF for management/client delivery — CI runs on git tag push
docs-pdf:
	@mkdir -p $(OUT_DIR)/pdf
	@for f in $(DOCS_DIR)/adr/*.md $(DOCS_DIR)/runbooks/*.md; do \
		pandoc $$f $(PDF_FLAGS) -o $(OUT_DIR)/pdf/$$(basename $$f .md).pdf; \
	done

# DOCX with corporate template — on-demand only, never automated
docs-docx:
	@echo "WARNING: DOCX generates large binary files. Commit only when required for client delivery."
	@mkdir -p $(OUT_DIR)/docx
	@pandoc $(1) $(DOCX_FLAGS) -o $(OUT_DIR)/docx/$$(basename $(1) .md).docx

docs-clean:
	rm -rf $(OUT_DIR)
```

### Artifact 5 — ADR-001 (Claude-generated from discovery evidence)

```markdown
# ADR-001: Plugin Event Handler Execution Order

**Date**: 2026-05-23  
**Status**: Accepted (documents existing behavior — not a new decision)  
**Deciders**: Senior Dev 1, Ops Lead (discovered via P0 discovery run)  
**Context tags**: events | plugin | ordering

## Context

The P0 discovery run identified that `IConsumer<T>` handlers registered by plugins
execute in alphabetical order of their plugin folder names (e.g., `/Plugins/Nop.Plugin.A/`
before `/Plugins/Nop.Plugin.B/`). This is an implicit contract enforced by plugin load
order in `PluginManager.LoadPlugins()`, not by any documented ordering mechanism.

Three plugins were found that implicitly depend on this ordering:
- `PaymentGatewayPlugin` assumes it runs before `AuditLogPlugin` on `OrderPlacedEvent`
- `InventoryPlugin` assumes it runs after `OrderProcessingPlugin` on `OrderPlacedEvent`
- `ERPSyncPlugin` assumes it runs last on `OrderPlacedEvent`

This assumption is fragile: any plugin rename or new plugin addition can silently change behavior.

## Decision

We will document the current execution order as an implicit constraint and introduce
an `[EventHandlerOrder(int priority)]` attribute to make ordering explicit. Priority
attribute will be read by a custom `PluginEventHandlerOrderer` in `Nop.Web.Framework`.

## Consequences

**Positive:**
- Event handler ordering becomes explicit, testable, and visible in code review
- Prevents regressions from plugin renames or new plugin additions

**Negative:**
- Requires code change in `Nop.Web.Framework` (non-plugin code)
- All existing `IConsumer<T>` implementations need priority attribute added (one-time migration)

**Neutral:**
- Ordering by attribute takes precedence over folder-name ordering
- Undecorated handlers continue to sort alphabetically (backward compatible)

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Document folder-name ordering and require plugin naming conventions | Convention-based — breaks silently with any rename |
| Use separate event buses per priority tier | Over-engineering for current scale |
```

---

## Session Summary

**Duration**: ~3 days across Week 3 (runbooks) and Week 4 (ADRs + Pandoc)

**Key insight**: The P0 discovery run provided the raw material for 5 evidence-based ADRs without requiring anyone to recall historical context from memory. Ground-truth discovery makes retrospective documentation accurate.

**Confluence migration decision**: Read-only archive. A redirect banner on every Confluence page: "This documentation is archived. Current docs: [GitHub repo link]. For runbooks: /docs/runbooks/. For decisions: /docs/adr/."

**Gems extracted from this session:**

> *A runbook without validation steps is a script without error handling — it tells you what to do, not whether it worked.*

> *Retrospective ADRs written from memory are fiction. Write them from code evidence, then add business context.*

> *The only ADR system that survives is one that runs automatically on structural code changes — not one that requires developers to remember a process.*

> *Pandoc's superpower is not generating PDFs — it's making Markdown the single source of truth for all document formats.*
