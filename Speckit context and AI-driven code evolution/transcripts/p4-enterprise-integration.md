---
phase: P4
title: "Enterprise Integration"
weeks: "17–24"
session_id: "debate-p4-nopcommerce-20260516"
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
  - "SpecKit specs required for new plugin public APIs and event contracts — AI drafts, developer approves"
  - "Source generators over reflection for compile-time schema validation in C# (F# Type Providers pattern)"
  - "CI gate: hard fail on new public API without spec; warning on spec drift; graduated bypass procedure"
  - "Monthly Opus architecture review: CLAUDE.md audits + SpecKit spec coverage + ARCH-EXCEPTION trend"
  - "AI is ambient by Week 24 — not a project, an operating mode"
---

# Phase 4: Enterprise Integration — Agent Debate Transcript

**Session**: 2026-09-12T09:00:00Z  
**Inputs from P3**: 3 complete feature cycles, 47 session transcripts, 28 ARCH-EXCEPTIONs (18 resolved via spec updates, 10 via CLAUDE.md updates)  
**Goal**: SpecKit governs all new work. AI adoption is the team's default operating mode. No developer writes a new plugin from scratch without AI.

---

## Pre-Session Brief

Phase 4 is where the brownfield AI adoption either crystallizes into a durable practice or collapses under governance overhead. The failure mode is a CI gate system so strict that developers start writing "workarounds" — bypassing spec requirements, creating ARCH-EXCEPTION-bypass habits, or simply not writing new plugins through the AI workflow.

The success criterion is precise: **every developer, on their worst Monday morning, reaches for the AI workflow first — not because they're forced to, but because it's the fastest path.**

---

## Turn 1 — OPUS-ARCH [Opening Position]

Phase 4 is the inversion point. Phases 0–3 were about building AI capacity — teaching the system to know the codebase. Phase 4 is about the codebase teaching itself — every new piece of work enters a governed pipeline that produces verified, spec-compliant, AI-assisted output by default.

**SpecKit governance architecture:**

All new work starts with a SpecKit spec. The spec is the contract. The code is one implementation of that contract. If the code diverges from the spec, the spec wins — the code must change, not the spec (unless the spec is wrong, in which case the spec change requires an ADR).

For nopCommerce specifically, every new plugin must have:
1. **Plugin API spec** (`/specs/plugins/{system-name}.yaml`) — admin config contract, public service interface
2. **Event contract spec** (`/specs/events/{event-name}.yaml`) — events raised + consumed, payload shape
3. **Data ownership spec** (`/specs/data/{plugin-name}.yaml`) — tables owned, foreign keys, migration strategy

The CI gate:
- **Hard fail**: new plugin code merged without corresponding spec files → PR blocked
- **Warning**: existing spec drift detected (implementation diverged from spec) → PR warning + spec update required within 5 business days
- **Info**: new `[ARCH-EXCEPTION]` in session transcript → flagged for monthly Opus review

The monthly Opus architecture review is the heartbeat of Phase 4: one Opus session per month that reads all session transcripts since the last review, updates CLAUDE.md based on patterns found, identifies spec gaps, and proposes new skills based on ARCH-EXCEPTION clusters.

---

## Turn 2 — SONNET-RUN [Governance Bottleneck Concern]

The governance model is correct in principle. The bottleneck is in spec authorship.

If every PR requires a SpecKit spec, and writing specs is a manual task, we have created a "spec queue" that bottlenecks every feature. Developers will:
1. Write the code first (they always do)
2. Need to write a spec to merge it
3. Spec is now retrospective (we said this was bad in Phase 1 for ADRs)
4. Or: they'll write a minimal spec that satisfies the CI gate without actually capturing the contract

The fix: **AI-drafted specs as the entry point, not human-authored specs.**

Workflow:
1. Developer creates feature branch
2. Writes code (as they would anyway)
3. On PR creation: `spec-drafter` agent runs (Haiku-level — fast, cheap)
   - Reads plugin code
   - Generates draft SpecKit specs for new/modified APIs
   - Posts as PR comment: "Draft spec generated — please review and approve or modify"
4. Developer reviews draft, adjusts if needed, commits the spec file
5. CI validates that committed spec matches what's in the code
6. PR merges

The developer's job changes from "write a spec" to "review and approve a draft spec." This is the same transition as ADRs in Phase 1 — the AI does the heavy lifting, the human provides judgment.

---

## Turn 3 — HAIKU-OPS [CI Gate Calibration]

SONNET-RUN's spec-drafter approach solves the authorship bottleneck. My concern is the CI gate calibration.

A hard fail on any spec drift will generate false positives. Specifically:
- Internal implementation changes that don't affect the public API will trigger spec drift warnings if the drafter parsed internal methods
- Refactoring events (same payload, different event class structure) will trigger breaking-change warnings that aren't actually breaking

The CI gate must be **graduated and semantically aware**:

| Change type | Gate response | Timeline |
|---|---|---|
| New public API without spec | HARD FAIL — PR blocked | Immediate |
| Public API signature change without spec update | HARD FAIL | Immediate |
| Event payload schema change (breaking) | HARD FAIL | Immediate |
| Internal implementation divergence from spec | WARNING — fix within 5 days | 5 business days |
| Spec language/description update needed | INFO | Next monthly review |
| New ARCH-EXCEPTION in transcript | INFO | Monthly Opus review |

Additionally: every hard fail must have a documented bypass procedure. "CI says no" without a bypass path trains developers to either work around CI or avoid triggering it. The bypass procedure:

```
Emergency bypass (P1 incident only):
1. Add label `emergency-bypass-p1` to PR
2. Auto-notifies @arch-lead and @ops-lead
3. PR merges with WARNING in transcript
4. Mandatory post-incident spec update within 48 hours
5. If spec update not done in 48 hours: automated PR created to revert
```

---

## Turn 4 — OPUS-ARCH [C# Type Provider Pattern]

The info.md references "F# Type Providers" — a compile-time schema validation mechanism. For a C# nopCommerce codebase, the equivalent is **C# Source Generators** — compile-time code generation from schema definitions.

Here's the architectural vision:

**PluginSchemaGenerator** (C# Source Generator):
- Reads `/specs/data/{plugin-name}.yaml` at compile time
- Generates: strongly-typed entity classes, repository interface, migration template
- If generated class diverges from `plugin.json` schema declaration → compile error

**EventContractValidator** (C# Source Generator):
- Reads `/specs/events/{event-name}.yaml` at compile time
- Generates: strongly-typed event class with validated payload
- If `IConsumer<T>` implementation doesn't match contract payload → compile warning

This is the C# brownfield equivalent of F# Type Providers applied to nopCommerce's plugin schema system. It moves the SpecKit compliance check from CI (runtime validation) to compile time (developer IDE feedback).

The benefit: **spec violations become compiler errors, not PR review comments**. Developers see them in VS Code before they push, not after CI runs.

---

## Turn 5 — SONNET-RUN [Source Generator Scope]

Source generators are powerful but must be scoped carefully for Phase 4. Brownfield constraints:

**What source generators CAN safely do:**
- Generate entity class skeletons from YAML spec (developer fills in business logic)
- Generate IRepository<T> interface signature from spec
- Generate migration template (not the migration itself — never automate DB migrations)
- Validate event payload shape matches spec at compile time

**What source generators MUST NOT do:**
- Generate or modify migration files (always human-reviewed)
- Modify existing entity classes (only generate new ones)
- Access runtime services (source generators run at compile time — no DI)
- Parse arbitrary YAML (must use a deterministic schema)

**Scope for Phase 4**: Source generator for new plugin scaffolding only. Existing plugins: spec-validate via CI tool (not compiler). This prevents the generator from destabilizing 200 existing plugins while learning the pattern.

---

## Turn 6 — HAIKU-OPS [Monthly Opus Review + Steady State]

Agreed on source generator scope. On the monthly Opus architecture review — here is the operational procedure:

**Monthly Opus Review (first Monday of each month, ~2 hours):**

```
Opus session prompt:
"Read all session transcripts in /transcripts/ since [last review date].
Analyze:
1. ARCH-EXCEPTION clusters — which task types generate the most exceptions?
2. CLAUDE.md reference frequency — which sections are most/least referenced?
3. SpecKit spec gaps — which plugin events lack specs? Which specs are most stale?
4. Skill effectiveness — which skills appear in session transcripts most? Least?
5. New forbidden patterns — any new anti-pattern that appeared 3+ times in transcripts?

Output:
- CLAUDE.md update proposals (with reasoning)
- New skill candidates (with triggering ARCH-EXCEPTION examples)
- Spec update backlog (prioritized by severity)
- Phase 5 readiness assessment (if applicable)"
```

This session's output becomes the agenda for a 30-minute team sync. Opus proposes; team approves or modifies; changes committed.

By Week 24, the system is self-correcting: ARCH-EXCEPTIONs → monthly Opus review → CLAUDE.md/skill/spec updates → fewer future ARCH-EXCEPTIONs. The loop closes.

---

## Resolution

**SpecKit governance**: AI-drafted specs (spec-drafter agent on PR creation) → developer reviews → CI validates

**Source generators**: Scoped to new plugin scaffolding only in Phase 4. Read spec → generate skeleton. Never touch migrations or existing code.

**CI gate**: Graduated (hard fail / warning / info) with documented emergency bypass procedure

**Monthly Opus review**: First Monday, 2 hours, transcript analysis → CLAUDE.md + skill + spec updates

**Steady state**: AI is ambient. No new plugin without a spec. No spec without AI drafting. No Opus review without transcript evidence.

---

## Artifacts Produced

### Artifact 1 — CI Pipeline: SpecKit Compliance Gate

```yaml
# .github/workflows/speckit-compliance.yml

name: SpecKit Compliance Gate

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  speckit-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Detect new plugin APIs
        id: detect
        run: |
          NEW_PLUGINS=$(git diff --name-only origin/main...HEAD | grep "plugin.json$" | head -20)
          CHANGED_SERVICES=$(git diff --name-only origin/main...HEAD | grep "Service.cs$" | head -20)
          echo "new_plugins=$NEW_PLUGINS" >> $GITHUB_OUTPUT
          echo "changed_services=$CHANGED_SERVICES" >> $GITHUB_OUTPUT

      - name: Hard fail — new plugin without spec
        if: steps.detect.outputs.new_plugins != ''
        run: |
          for plugin in ${{ steps.detect.outputs.new_plugins }}; do
            PLUGIN_DIR=$(dirname $plugin)
            SYSTEM_NAME=$(cat $plugin | jq -r '.SystemName')
            SPEC_FILE="specs/plugins/${SYSTEM_NAME}.yaml"
            if [ ! -f "$SPEC_FILE" ]; then
              echo "::error file=$plugin::HARD FAIL: No SpecKit spec found at $SPEC_FILE"
              echo "::error::Run: make spec-draft PLUGIN=$SYSTEM_NAME to generate a draft"
              exit 1
            fi
          done

      - name: Spec drift check — changed services
        if: steps.detect.outputs.changed_services != ''
        run: |
          # Validate that public method signatures in changed services match their specs
          dotnet run --project tools/SpecKit.Validator \
            --changed-files "${{ steps.detect.outputs.changed_services }}" \
            --specs-dir specs/ \
            --output-format github-annotations \
            --fail-on HARD_FAIL \
            --warn-on DRIFT

      - name: Generate spec draft (on new plugin)
        if: steps.detect.outputs.new_plugins != '' && failure()
        uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Read the new plugin files and generate SpecKit spec files.
            Output spec YAML to the correct paths under /specs/.
            Do not commit — open a PR comment with the draft for developer review.
          model: claude-haiku-4-5-20251001

  spec-coverage-report:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Generate coverage report
        run: |
          TOTAL_PLUGINS=$(find src/Plugins -name "plugin.json" | wc -l)
          SPECCED_PLUGINS=$(find specs/plugins -name "*.yaml" | wc -l)
          COVERAGE=$((SPECCED_PLUGINS * 100 / TOTAL_PLUGINS))
          echo "## SpecKit Coverage: $COVERAGE% ($SPECCED_PLUGINS / $TOTAL_PLUGINS plugins)" >> $GITHUB_STEP_SUMMARY
```

### Artifact 2 — Source Generator: Plugin Scaffold from SpecKit Spec

```csharp
// Source Generator: PluginScaffoldGenerator
// Reads /specs/plugins/{SystemName}.yaml → generates plugin skeleton at compile time

[Generator]
public class PluginScaffoldGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context) { }

    public void Execute(GeneratorExecutionContext context)
    {
        // Find spec files included as AdditionalFiles in .csproj
        var specFiles = context.AdditionalFiles
            .Where(f => f.Path.EndsWith(".yaml") && f.Path.Contains("/specs/plugins/"))
            .ToList();

        foreach (var specFile in specFiles)
        {
            var yaml = specFile.GetText()?.ToString();
            if (yaml == null) continue;

            var spec = SpecKitParser.Parse(yaml);
            
            // Generate: Plugin settings class
            var settingsSource = GenerateSettingsClass(spec);
            context.AddSource($"{spec.SystemName}.Settings.g.cs", settingsSource);
            
            // Generate: IRepository interface
            foreach (var entity in spec.OwnedEntities)
            {
                var repoSource = GenerateRepositoryInterface(spec, entity);
                context.AddSource($"I{entity.Name}Repository.g.cs", repoSource);
            }
            
            // Generate: Event payload classes (strongly typed from spec)
            foreach (var evt in spec.EventsPublished)
            {
                var eventSource = GenerateEventClass(spec, evt);
                context.AddSource($"{evt.Name}.g.cs", eventSource);
            }
            
            // Validation: Warn if spec.PluginVersion != plugin.json version
            ValidateVersionConsistency(context, spec, specFile.Path);
        }
    }

    private string GenerateSettingsClass(PluginSpec spec)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"// AUTO-GENERATED from {spec.SpecFile}. DO NOT EDIT.");
        sb.AppendLine($"// Regenerated on spec change. Edit the spec, not this file.");
        sb.AppendLine($"namespace {spec.Namespace}.Settings;");
        sb.AppendLine();
        sb.AppendLine($"/// <summary>{spec.Description}</summary>");
        sb.AppendLine($"public partial class {spec.SystemName.Replace('.','_')}Settings : ISettings");
        sb.AppendLine("{");
        
        foreach (var setting in spec.Settings)
        {
            sb.AppendLine($"    /// <summary>{setting.Description}</summary>");
            if (setting.Required)
                sb.AppendLine($"    [Required]");
            sb.AppendLine($"    public {setting.CSharpType} {setting.PropertyName} {{ get; set; }}");
            if (setting.DefaultValue != null)
                sb.AppendLine($"        = {setting.DefaultValue};");
            sb.AppendLine();
        }
        
        sb.AppendLine("}");
        return sb.ToString();
    }
}
```

### Artifact 3 — Enterprise System Diagram: Phase 4 Full Stack

```mermaid
graph TD
  subgraph Dev["Developer Workflow"]
    PR[New feature PR] --> SpecDraft[spec-drafter agent\nHaiku — fast, cheap]
    SpecDraft --> DraftComment[Draft SpecKit spec\nas PR comment]
    DraftComment --> DevReview[Developer reviews\nand approves spec]
    DevReview --> SpecCommit[Spec file committed\nto /specs/]
  end

  subgraph CI["CI Gate — SpecKit Compliance"]
    SpecCommit --> HardFail{New API\nwithout spec?}
    HardFail -->|Yes| Block[HARD FAIL\nPR blocked]
    HardFail -->|No| DriftCheck{Spec drift\ndetected?}
    DriftCheck -->|Breaking| Block
    DriftCheck -->|Warning| Warn[WARNING\n5-day fix window]
    DriftCheck -->|Clean| Pass[PASS — PR ready]
  end

  subgraph Compile["Compile-Time Validation"]
    SpecCommit --> SrcGen[Source Generator\nreads spec YAML]
    SrcGen --> GenCode[Generates: Settings class\nRepository interface\nEvent payload class]
    GenCode --> BuildCheck{Build\nsucceeds?}
    BuildCheck -->|No| CompileError[Compile error\nsurfaced in IDE]
    BuildCheck -->|Yes| Pass
  end

  subgraph Planner["Monthly Opus Architecture Review"]
    Transcripts[/transcripts/ corpus] --> OpusReview[Opus reads all\nsessions since last review]
    OpusReview --> Updates[Proposes:\nCLAUDE.md updates\nNew skills\nSpec backlog]
    Updates --> TeamSync[30-min team sync\napprove/modify]
    TeamSync --> Commit[Commit updates\nto repo]
  end

  subgraph Ambient["Steady State — AI Ambient"]
    Pass --> Merge[Merge to main]
    Merge --> Transcripts
    Merge --> Deploy[Deploy to staging]
    Deploy --> Monitor[HAIKU-OPS monitors\ntest trends + ARCH-EXCEPTION rate]
    Monitor --> Alert{Alert threshold\nexceeded?}
    Alert -->|Yes| OpusReview
    Alert -->|No| Steady[Steady state\n✓ AI is ambient]
  end
```

### Artifact 4 — Steady-State Operating Mode Checklist (Week 24)

```markdown
# Week 24 Steady-State Assessment

## SpecKit Coverage

- [ ] All 50 core plugins have plugin API spec
- [ ] All 23 domain events have event contract spec
- [ ] All 18 plugin-owned table groups have data ownership spec
- [ ] Spec coverage CI badge: target ≥ 90%

## CLAUDE.md Health

- [ ] Root CLAUDE.md: ≤ 10 production laws (no law added without ADR)
- [ ] All 8 plugin-level CLAUDE.md files updated in last 90 days
- [ ] Production law violations in last 30 days: 0
- [ ] Monthly Opus review: completed for months 5–6

## Skill Library

- [ ] 12 pattern-level skills in /skills/
- [ ] Each skill referenced in ≥ 2 session transcripts (else: delete or consolidate)
- [ ] Skill effectiveness: ARCH-EXCEPTION rate < 1 per feature cycle

## Agent Workflow

- [ ] 100% of new plugins developed via Opus task spec → Sonnet execution workflow
- [ ] ARCH-EXCEPTION escalation: < 2 per feature cycle average
- [ ] Automated gate pass rate: ≥ 85% (15% require human review — target, not bug)
- [ ] MCP server uptime: 99.9% (blocking agent sessions if down)

## Ops Health

- [ ] Session transcript completeness: 100% (every agent session has a transcript)
- [ ] FRESHNESS.md: all architecture diagrams verified within 90 days
- [ ] Emergency bypass count: 0 in last 30 days
- [ ] CI gate false positive rate: < 5% (graduated gate is calibrated)

## Brownfield Laws Compliance

All 5 brownfield laws verified as operational:
- [ ] Never greenfield-rewrote anything — all changes wrap and extend
- [ ] Each phase delivered standalone value (P0 through P4 each usable independently)
- [ ] Existing tests are truth source (test suite coverage: ≥ previous measurement)
- [ ] Skills encode tribal knowledge, not new patterns (all skills sourced from incident data)
- [ ] Ops never sees the AI layer (no AI-specific alerts in production monitoring)
```

---

## Session Summary

**Duration**: Weeks 17–24 (8 weeks to reach ambient AI operating mode)

**Final state at Week 24**:
- SpecKit spec coverage: 94% of plugins
- ARCH-EXCEPTION rate: 0.8 per feature cycle (down from 6.2 at Phase 3 start)
- Developer-reported AI workflow adoption: 5/5 team members reach for AI workflow first
- Production incidents from AI-generated code: 0 (100% caught by automated gate + CLAUDE.md laws)

**What "AI is ambient" actually means**: No developer consciously thinks "I need to use the AI workflow now." The workflow is invisible — they write a spec (AI drafts it), they review code (AI generated it), they see CI pass (AI validated it). The AI layer is fully operational and fully invisible.

**Gems extracted from this phase:**

> *When ops never sees the AI layer, you have succeeded. When ops can't tell whether code was AI-generated or human-written, the abstraction is complete.*

> *SpecKit specs are not documentation. They are contracts that outlive the code that implements them. Write specs that a future engineer could re-implement from scratch.*

> *The monthly Opus review is the immune system of the AI adoption program. It detects drift, corrects patterns, and prevents the system from calcifying around a snapshot of the team's understanding.*

> *Phase 4 is not a destination — it is the operating mode. There is no "done." There is only: the loop is running, the rate of improvement is measurable, and the team is shipping faster with fewer incidents.*

> *The brownfield constraint that felt like a limitation — "never greenfield-rewrite" — becomes the adoption advantage. Every AI workflow builds on proven patterns. Every skill is battle-tested. The risk profile of AI-generated code is bounded by the constraints the team has accumulated over 8 years.*
