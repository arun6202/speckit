# The Descent — Handoff Brief for a Continuing Instance

> **You are picking up an in-flight project.** This document transfers the full working context, the
> *reasoning* behind every decision (not just the artifacts), the kit map, the unresolved forks, and your
> operating instructions. Read this top to bottom, then the zip, then the source code the user points you at.
> Your job is to reach the level of understanding the prior instance held — and then exceed it by filling the
> stubs from real source, resolving the forks with the user, and hardening the tooling.

---

## 0. How to use this handoff (read first)

**What you're inheriting.** A Claude-native, just-in-time (JIT) troubleshooting system for an undocumented
data pipeline, delivered as a drop-in repo kit (`descent-starter-kit.zip`) plus a field-guide HTML. The
intellectual core is settled; the environment-specific data and the executable depth are deliberately stubbed
for the user (a senior F# architect) to populate.

**Read order.**
1. This brief (theory + rationale + map + forks + instructions).
2. The kit: start at `README.md` → `CLAUDE.md` → `.claude/skills/pipeline-descent/SKILL.md` → the `rungs/` and
   `reference/` files → `fsx/` → `knowledge/` (the OKF bundle) → `the-descent.html` (the visual reference).
3. The source code the user points you at (the F# ETL fsproj, the C# Web API). Treat the fsproj as the
   authoritative lineage source; treat the C# as read-only intelligence (the ⚠️ boundary, §8).

**Your job, in order.**
- Internalize the theory and the invariants below.
- Ask the user the open forks (§13) — they change how the tooling is wired.
- Populate the stubs from real source (endpoint catalog, lineage map, env hosts, OKF concepts).
- Harden the `fsx/` skeletons into runnable probes against non-prod.
- Keep the discipline (§8) and the design/voice (§15) intact.

**Invariants you must not regress (the non-negotiables).**
1. **Read-only probes, everywhere — prod and non-prod.** No ES writes, no Oracle DML, no Kafka offset
   mutation. Enforced twice: a `PreToolUse` hook (`.claude/hooks/block-writes.sh`) and the F# `ReadOnly<'conn>`
   type that makes a write unrepresentable. Fixes go plan → human approval → reviewed script → execute.
2. **F# discipline (the user's identity law).** parse-don't-validate, DUs over classes, `Result` over
   exceptions, types-as-proofs. Flag any C# idiom leaking into F# with ⚠️. (§8.)
3. **Stop at the first gate that convicts.** The descent is depth-first and lazy; don't over-descend. (§4.)
4. **Lineage is a lookup from the ETL fsproj, never a guess.** (§3, §11.)
5. **Oracle is ground truth.** Never "fix" ES to mask a source-of-record defect — escalate it. (§3.)
6. **A verdict is incomplete without a regression property test.** (§7.)
7. **OKF is context, not contract.** It captures meaning/lore; it does not validate. Link to ODCS/ODPS,
   don't duplicate. (§10.)

**How to exceed the prior instance (explicitly).** Resolve the §13 forks; replace `fsx/` `TODO`s with real
Oracle/ES/Kafka clients; run and grow the `evals/` set; densify the `knowledge/` OKF graph from real source;
verify the §12 version-drift items against the actual OGG/ES versions. Each of those turns settled *theory*
into settled *fact* about this specific system — which is the part the prior instance could not do without
source and environment access.

---

## 1. The business problem

A Fortune-500 data pipeline, roughly:

```
Oracle (≈50 tables, system of record)
   → F# ETL project (.fsproj)  — manages the full load Oracle→Elasticsearch; also the lineage authority
      → Elasticsearch target index (denormalized; ~150M docs)
         → C# Web API (.csproj)  — exposes the ES index as Swagger/OpenAPI endpoints, organized into modules
            → consumers  — abstracted from ES; they believe they are querying Oracle relationally

Realtime arm:
Oracle GoldenGate CDC → Kafka → temp ES index → merge/upsert → target ES index (same endpoints)
```

Defects are reported as Jira tickets across prod and non-prod. **There is no reliable documentation.** The
abstraction is the root of the trouble: a consumer thinks they are querying Oracle, but they are reading an
*analyzed, denormalized, possibly stale* ES document. Every defect is a gap between that **felt contract**
(Oracle-like) and the **real substrate** (the ES doc and the path that filled it). Troubleshooting is the act
of re-deriving the lineage the abstraction hides — fast, per ticket, without a spec that doesn't exist.

The user has sample endpoint lists and sample requests but no trustworthy docs. The goal: triage →
troubleshoot → fix defects the "Claude-native" way, inferring context just-in-time from the codebase.

---

## 2. The thesis: descent, not spec

**Do not write a big-bang specification / SDD pass first.** Modeling 50 tables, an ES query DSL, the C# API,
and the CDC path before the first ticket is debt you'd carry forever, and it rots the moment code changes.
Instead:

- **JIT, not big-bang.** Each defect *pulls* exactly the context it needs out of the codebase.
- **The system documents itself one ticket at a time.** Every resolved ticket *leaves behind* residue: a
  lineage fragment, a regression property test, a knowledge concept (§7, §10).
- **Inference is cheaper than authorship.** The lineage already exists in the fsproj and the C# query builder;
  read it on demand rather than transcribe all of it into prose that drifts.

The name **"The Descent"** encodes this: you start at the surface symptom (the API response) and drill *down*
through the layers toward ground truth (Oracle), stopping at the depth where the bug lives. It's the opposite
epistemic motion to SDD, which *ascends* — constructs a model upward before touching anything.

---

## 3. Core concepts

- **System of Record (SoR) = Oracle.** Ground truth. If the SoR is wrong, the pipeline was faithful and the
  ticket is a *data* defect (escalate to the data owner), not a *code* defect.
- **System of Reference (SoReference) = Elasticsearch.** The derived truth the consumer actually reads. It can
  drift from the SoR via a batch transform bug or a realtime path that arrived late, out of order, or never.
- **The abstraction gap.** Consumers query the API as if it were Oracle; it serves ES. Most "API is wrong"
  tickets are this gap.
- **Lineage = a lookup.** The ETL fsproj is the authoritative lineage source. The descent reads it (via a
  subagent), it does not infer fresh each time. The fsproj's compile order is the index of ETL meaning.

---

## 4. The Descent protocol — six rungs, gate-based, stop at first conviction

Each rung is a single yes/no **gate**. Clear it → descend (and load the next layer's context). Fail it →
**convict** and stop. A green gate is the *only* permission to load deeper context. Most tickets convict at
rungs 1–3 and never touch Oracle, ETL, or Kafka.

| # | Rung | Gate | Convicts as |
|---|---|---|---|
| 1 | **Triage & scope** | Maps to a known endpoint + key? | (bounce if not actionable) |
| 2 | **Reproduce & validate; if zero hits, SHRINK** | Malformed? Valid-but-empty? Wrong value? | `InvalidRequest` / → The Shrink / descend |
| 3 | **Lineage (lookup from ETL fsproj; reads C# ⚠️)** | API field still bound to the right ES field? | `ContractDrift` |
| 4 | **System of record (Oracle = ground truth)** | Oracle value correct? | `SorDataIssue` (escalate) / descend, drop Oracle |
| 5 | **Batch reconcile (re-run the transform)** | Transform output == target/expected? | `TransformDefect` / descend (realtime) |
| 6 | **Realtime trace (Oracle→Kafka→temp ES→target)** | Where did the change stop? | `RealtimeStale` / `RealtimeDrop` / `MergeReorder` |
| 7 | **Verdict reflection (falsify before committing)** | Cause uniquely supported? Property fails-on-bug? | accept / revise |

The stopping rule is the whole point: lazy, depth-first, prune-as-you-go. You're never holding all layers at
once — not in your head, not in the context window. Detail per rung: `.claude/skills/pipeline-descent/rungs/`.

---

## 5. The Shrink — the centerpiece (rung 2 sub-protocol)

**The problem it solves:** a valid request, taken from the sample list, searches the right fields with the
right values and the right combination — and returns **zero hits** when the data should exist.

**The reframe:** the empty query *is a failing counterexample.* Bisect its predicates to the **1-minimal**
subset that still returns zero — that subset is the culprit. This is **delta debugging** (Zeller &
Hildebrandt's `ddmin`, 2002) and is conceptually identical to **FsCheck shrinking** a failing input to its
minimal reproducer. (This technique was the user's own idea; the prior instance formalized it.)

**Algorithm:** `ddmin` over `Predicate list` — divide into n chunks (start n=2), test subsets/complements,
recurse into whichever still returns zero, double granularity, finish with a one-by-one deletion pass to
*guarantee* minimality. Binary-search fast in the common case. Implementation: `fsx/Descent.Shrink.fsx`.

**Then classify why the culprit empties it — test in this order (by base rate):**

| # | Cause | Diagnostic |
|---|---|---|
| 1 | **Analyzer / term-vs-match** (`term` on `text`, or `match` on `keyword`) | `_analyze` (compare index vs query tokens); use `match` on `text`, `term` on `text.keyword` |
| 2 | **Case** (`term` is case-sensitive) | `case_insensitive:true` (≥7.10, keyword) or lowercase normalizer |
| 3 | **`minimum_should_match` flip** (a `should` set becomes optional once a `must`/`filter` is added) | set it explicitly; tag clauses with `_name` → read `matched_queries` |
| 4 | **Nested scope** (querying `nested` without `nested`+`path`; or `object` array flattening) | wrap in `nested`; use `inner_hits` |
| 5 | **Mapping / field absence** | `_field_caps?fields=f`, then `_mappings` |
| 6 | **Range / TZ / alias / routing** | `_validate/query?rewrite=true`; check the alias write-index |

**Diagnostic triad:** `_analyze` (tokens in vs out) · `_validate/query?rewrite=true` (the real Lucene) ·
`_explain/<known-good-id>` (why a specific doc didn't match). The known-good `_id` comes free from the lineage
lookup (rung 3). Reference: `.claude/skills/pipeline-descent/reference/es-zero-hit-ladder.md` and
`reference/ddmin-shrink.md`. Watch `indices.query.bool.max_clause_count` (4096 on ES 8.x) — shrink *logical*
predicates, not expanded clauses.

---

## 6. The Realtime trace (rung 6)

**The problem it solves:** a stale document. Don't re-check Oracle and target ES; walk the event path and find
the hop where the change *stopped*: Oracle → Kafka message → temp ES → target merge.

**Per-hop evidence:**
- Oracle: did the row change & commit?
- GoldenGate/Kafka: message present at the business key? OGG envelope fields — `op_type` (I/U/D/T), `op_ts`
  (source trail, replay-stable), `current_ts` (formatter time, *not* replay-stable), `pos` (seqno+RBA),
  `primary_keys`, and `${csn}` (the source commit sequence number — there is **no default `csn` field**; emit
  it via the metacolumn template). Key the topic by `${primaryKeys}` so a row's changes land on one partition
  in commit order.
- Consumer: `kafka-consumer-groups --describe` → `CURRENT-OFFSET` / `LOG-END-OFFSET` / `LAG` per partition.
- Temp ES: did the doc land? (deserialization/schema errors stop it here.)
- Target merge: did the upsert apply, in order?

**The ordering defect that masquerades as staleness:** if the merge is **last-write-wins**, an out-of-order
CDC replay overwrites newer data with older — a "stale" doc that's really a *reorder*. Fix: index with
`version_type=external` keyed on CSN/SCN so a lower version can never overwrite a higher. In-cluster
concurrency: `if_seq_no` + `if_primary_term`.

**Bonus tip (prove arrival between Oracle, the Kafka message, and temp ES):** because the topic is keyed by
the business key, read the one message deterministically
(`kafka-console-consumer --partition P --offset O --max-messages 1`), follow the `op_ts`/`pos`/`csn` trail; the
hop where the trail goes cold is the stage that dropped the change. Reference:
`.claude/skills/pipeline-descent/reference/ogg-kafka-envelope.md`. Implementation: `fsx/Descent.Realtime.fsx`.

---

## 7. How issues resolve — the closed-set taxonomy, verdict, and residue

**RootCause is a closed set** (a discriminated union). Every ticket resolves to exactly one:
`InvalidRequest · AnalyzerMismatch · CaseMismatch · ShouldFlip · NestedScope · MappingIssue · ContractDrift ·
SorDataIssue · TransformDefect · RealtimeStale · RealtimeDrop · MergeReorder`. (See `fsx/Descent.Domain.fsx`.)

**Reflection (rung 7) before committing:** critique the cause against the evidence, re-probe with an
*independent* signal (not self-judgement), and require the regression property to (a) FAIL on the current bug
and (b) PASS after the proposed fix. If it can't be made to fail on the bug, the bug isn't understood yet.

**Residue (required — "no residue, not done"):** a regression property test (FsCheck/Expecto) in CI, a lineage
fragment, and an OKF concept (§10). This is the anti-doc-rot mechanism: documentation becomes a *gate in the
workflow*, not a deferred chore.

---

## 8. The F# discipline (the user's identity law — do not violate)

The diagnostic tooling is F# and obeys strict functional discipline. This is non-negotiable for this user; any
C# pattern in F# is a ⚠️ violation to flag.

- **parse-don't-validate** — push validation to the boundary; return a parsed type that makes illegal states
  unrepresentable. The connection example: `ReadOnly<'conn>` is a `private`-constructor type with no
  `execute`/`index` function — a write is *unrepresentable*, not merely "checked at runtime."
- **DUs over classes** — model the domain as discriminated unions; single-case DUs for primitives
  (`BusinessKey of string`) to avoid primitive obsession.
- **`Result<'T,'E>` over exceptions** — every Oracle/ES/Kafka call returns `Result`; compose with
  `Result.bind`/computation expressions. Exceptions only for true infrastructure failure.
- **types as proofs** — a constructed `MinimalFailingPredicateSet` is itself evidence the shrink converged.
- **typed telemetry as data** — thread `Step`/`Trace` values; never bury `printf` side-effects in an effect.
- **pure core / effectful shell** — a pure `Planner` decides the next probe; an effectful `Runner` runs it.

**The one ⚠️ C# boundary:** the `lineage` probe is the *only* function that reads the C# Web API (controllers,
DTO classes, the ES query builder, Swagger). Its sole job is to convert that into immutable `LineageEdge`
values and the known-good `EsId`. Nothing class-shaped, nullable, or exception-based escapes it. The C# API is
read-only intelligence, never a pattern to import. Rules: `.claude/rules/fsharp-discipline.md`,
`.claude/rules/csharp-api-boundary.md`. **Why F#:** the user treats type discipline as a survival strategy in
the agentic era — "a predicate is a proposition; a refined value is its proof; the pipeline is a
proof-carrying dataflow graph." Honor it.

---

## 9. Claude-native mechanics + the six reliability patterns

**Progressive disclosure (context arrives per rung):** T0 the ticket only · T1 endpoint→module→ES index ·
T2 the lineage subgraph + known-good `EsId` · T3 transform code + SoR row + Kafka message. Never preload all
50 tables or the whole OpenAPI.

**Context pruning (a green gate is a forget signal):** request validated → drop the OpenAPI contract; lineage
confirmed → drop the other 49 tables; SoR correct → drop Oracle; batch clean → drop the ETL source. Pruning is
what keeps a long descent from degrading into vague pattern-matching — and it's the thing most "agent
reliability" advice omits.

**Primitives (encode the discipline once):** a SKILL.md skill (`pipeline-descent`, progressive disclosure,
<500-line body, one file per rung/reference) · a `lineage-resolver` subagent (heavy fsproj reading in an
isolated window, returns only typed lineage) · a `PreToolUse` hook (exit 2 to deny writes) · plan mode
(Explore-first) · per-ticket evidence files (`tickets/<JIRA-ID>/NOTES.md`).

**The six reliability patterns, mapped — with the cost the generic version omits** (full table:
`.claude/rules/agent-reliability.md`):
1. **Reflection** → rung 7 (falsify before committing); the *property test* is the independent critic — not
   self-grading, which entrenches blind spots.
2. **Plan & Execute** → the rung plan + plan mode; gates allow mid-flight replanning.
3. **Layered memory** → short-term scope / retrieved codebase / episodic OKF cache — always paired with
   pruning (forgetting is half of memory).
4. **Tool design** → typed, single-purpose, read-only probes; `ProbeError` is the defined fallback. Strict
   schema ≠ safe — side-effect safety is the real risk.
5. **Human in the loop** → writes/fixes gated by `prod-safety.md`; investigation stays autonomous (don't gate
   every step).
6. **Eval suite** → `evals/` hard-ticket set + per-ticket regression properties; score *generalisation* and
   *early-stop*, not just cause-accuracy (penalise over-descent; watch eval overfit).

What this kit adds beyond the six: **context pruning** and a **typed stopping rule** — the two things that keep
the other patterns from compounding into a slow, over-careful, token-hungry loop.

---

## 10. Knowledge capture as OKF (Open Knowledge Format v0.1)

OKF (Google Cloud, published 2026-06-12) formalizes the LLM-wiki pattern into a portable, vendor-neutral
format: a directory of markdown **concepts** with YAML frontmatter, cross-linked into a graph. "Just markdown,
just files, just frontmatter." Only one field is required per concept — `type`; the common set is
`type, title, description, resource, tags, timestamp`. `index.md` per folder = progressive disclosure;
`log.md` = history. The kit's residue is captured as a conformant bundle in `knowledge/`.

**Why it changed the dynamics:** knowledge stops being *exhaust* (a byproduct in bespoke files) and becomes
*substrate* (a portable asset, decoupled from producer and consumer). Consequences: the integration matrix
collapses N×M → N+M; the substrate goes model-agnostic (feeds Claude, local models, a Knowledge Catalog, GPT —
useful for the user's multi-model/triangulation habit); documentation moves from willpower to a workflow gate;
the human role shifts author→curator (watch for rubber-stamp curation); and a new asset appears whose health
gates agent capability.

**The seam to hold (critical):** OKF is the **agent-and-human-readable context** layer (meaning, joins,
runbooks, defect lore). ODCS / ODPS / OpenLineage are **machine-enforceable** contracts (schemas, SLAs,
lineage events). They are complementary — a concept's `resource:` should *link* to the authoritative ODCS
artifact, never duplicate it. Keep the structured catalog authoritative; OKF is the narrative/interchange skin
over it. OKF is context, **not** enforcement — it does not catch drift. Rule:
`.claude/rules/knowledge-capture-okf.md`. Bundle guide: `knowledge/README.md`. Emitter scaffold:
`fsx/Descent.Okf.fsx`.

---

## 11. The kit map

```
descent-starter-kit/
├── README.md · CLAUDE.md · MANIFEST.txt · .gitignore   [READY]  orientation + always-loaded discipline
├── the-descent.html                                    [READY]  the visual field guide (full reference)
├── .claude/
│   ├── settings.json                                   [STUB]   hook wiring — verify vs your Claude Code version
│   ├── rules/                                           [READY]  descent-protocol, fsharp-discipline,
│   │                                                            csharp-api-boundary, elasticsearch-kafka,
│   │                                                            prod-safety, agent-reliability, knowledge-capture-okf
│   ├── skills/
│   │   ├── pipeline-descent/                            [READY]  SKILL.md + rungs/01–07 + reference/
│   │   │                                                         (es-zero-hit-ladder, ogg-kafka-envelope,
│   │   │                                                          ddmin-shrink, reliability-patterns)
│   │   └── oracle-es-mapping/                           [STUB]   pointer to the user's existing skill
│   ├── agents/lineage-resolver.md                      [READY]  subagent — returns typed lineage only
│   └── hooks/ (block-writes.sh, require-ticket-id.sh)  [READY]  read-only guard
├── fsx/                                                 [SKELETON] Domain · Probes · Shrink(ddmin) · Realtime ·
│                                                                  Engine · Okf · Eval · run-descent
│                                                                  + connections.template.json + README
├── docs/ai/                                             [STUB]   endpoint-catalog · lineage-map · known-envs ·
│                                                                  glossary · defect-taxonomy · memory-layers
├── evals/                                               [SEED]   eval-set.seed.json · score-descent.md
├── knowledge/                                           [READY-SEED] OKF v0.1 bundle (concepts + index/log)
└── tickets/                                             [READY]  TEMPLATE.evidence.md + JIRA-0000-example
```

Legend: **READY** = use as-is, light tuning · **SKELETON** = correct shape, plug in env-specific clients ·
**STUB/SEED** = filename + intent + a worked example; populate from real source. Every stub states what it
should become.

---

## 12. What's grounded vs. what to verify

**Research-grounded (current, citable):** the ES zero-hit ladder, `term`/`match`/`bool`/`minimum_should_match`
semantics, the `_analyze`/`_validate`/`_explain`/`_field_caps` APIs, `max_clause_count`=4096 (8.x), nested
pitfalls, optimistic concurrency (`if_seq_no`/`if_primary_term`, external versioning) — from official Elastic
docs. The OGG envelope fields, `${csn}`/`${primaryKeys}`, op-vs-tx mode, delete semantics — from official
Oracle GoldenGate docs. `ddmin` provenance (Zeller & Hildebrandt 2002) and FsCheck shrinking. Claude Code
primitives (Skills, subagents, hooks, plan mode, context engineering) — from official Anthropic docs. OKF —
from the Google Cloud announcement.

**To verify against THIS system (do not assume):**
- ES API surface stated for 8.x/9.x; confirm your version (`max_clause_count` especially).
- OGG: confirm `op` vs `tx` mode (tx → NULL key, which breaks per-key reads), `${csn}` availability, and
  whether full supplemental logging is on (else update/delete before-images may be partial).
- The target merge: confirm it uses **external versioning on CSN/SCN** (or `if_seq_no`/`if_primary_term`), not
  last-write-wins — out-of-order CDC is a leading cause of stale docs.
- `settings.json` hook schema against the installed Claude Code version.
- FsCheck 3.x namespaces differ from 2.x; shrinking doesn't work through F# query-expression syntax.

---

## 13. Open decisions / forks (resolve these with the user first)

1. **Tool substrate.** fsx as MCP server, F# CLI via bash, or FSI scripts? (User said fsx; confirm how they're
   surfaced to the agent.) If a custom MCP probe tool can write, the `PreToolUse` hook needs a matcher for it.
2. **fsx clients.** Which to commit to: raw-HTTP ES (`FSharp.Data`) vs `Elastic.Clients` (C#, wrap at the
   boundary); Oracle (`Oracle.ManagedDataAccess.Core`); Kafka (`Confluent.Kafka`). Fill the `Probes` stubs once chosen.
3. **`_id` / business-key construction.** The fact the whole lineage hinges on: how is the ES `_id` built from
   Oracle keys, and is it **identical** for batch and realtime? If they differ, that's its own defect class —
   add a rung-3 check.
4. **Merge contract.** temp→target: LWW, version/seq-gated, or keyed upsert? Decides whether rung 6 can tell
   *stale* from *dropped* from *reordered*.
5. **Prod access.** Read-only prod probes (user confirmed yes), vs reproduction in non-prod. Per-rung policy?
6. **OKF producer.** Optionally write a producer that walks the user's ODCS catalog and drafts OKF concepts
   (mirroring Google's BigQuery enrichment-agent pattern), so `knowledge/` bootstraps from the catalog.

(User has already answered: fsx tooling; fsx can query Oracle+ES in both prod and non-prod read-only; lineage
is a lookup from the ETL fsproj; staleness diagnosed by Oracle→Kafka→temp-ES arrival. Confirm the rest above.)

---

## 14. Next actions / build stages

1. **Read-only F# substrate.** Implement `Probes` connection + query for Oracle/ES/Kafka returning `Result`,
   with the read-only guard. Benchmark: round-trip a sample request and reproduce a zero-hit result via fsx.
2. **The Shrink tool.** Wire `ddmin` + the oracle (`Found|NotFound|Unresolved`) + classify via the ES triad.
   Threshold: on curated zero-hit tickets it converges to the true culprit with the minimal predicate set.
   Always test analyzer-mismatch first.
3. **The reconciler.** `rtTrace` Oracle→Kafka(partition+offset)→temp→target, emit a `HopResult`. Benchmark:
   correctly localizes an injected drop at each hop in non-prod.
4. **Wrap in the workflow.** Confirm the SKILL.md, the `lineage-resolver` subagent, the read-only hook, the
   per-ticket evidence convention, and the OKF emit-loop all fire on a real end-to-end ticket without manual
   ES-console steps.
5. **Populate knowledge.** As tickets resolve, emit OKF concepts; periodically densify the graph from source.

Populate the stubs by reading the source: the fsproj gives lineage + `_id` construction + transforms; the C#
gives the API→ES query mapping (⚠️ boundary); the sample requests give the endpoint catalog.

---

## 15. Design & voice (so any human-facing artifact stays coherent)

The field guide (`the-descent.html`) uses the user's established design language — **dark ink** background;
color semantics **green = verified/SoR-correct**, **amber = suspect/drift/query-side**, **steel-blue =
batch/structural/lineage**, **violet = realtime/CDC**, **crimson = convicted defect / ⚠️ C# boundary**. Type:
Space Grotesk (display) / Spectral (serif body, nodding to the user's Tamil-literature sensibility) / JetBrains
Mono. Signature devices: the **descent spine** (vertical drill) and the **shrink ladder** (predicates peeling).
A single Thirukkural epigraph (Kural 504) frames triage. Naming is a family: **The Descent** (drill the layers)
and **The Shrink** (narrow the query) — both downward-and-inward. (Note: this HANDOFF is rendered in Material 3
instead, per the user's request; the field guide keeps the dark-ink language.)

Voice: precise, plain verbs, no filler; a slightly literary register is welcome; honest about tradeoffs and
caveats; flag uncertainty rather than overclaim.

---

## 16. Glossary

- **Descent** — the six-rung gate-based triage protocol; stop at the first failing gate.
- **Shrink** — query bisection (`ddmin` = FsCheck shrinking) isolating the field/value that empties a search.
- **SoR / SoReference** — Oracle (ground truth) / Elasticsearch (derived, served).
- **Lineage edge** — API field → ES field → Oracle table.column, with the freshness path (batch vs CDC topic).
- **Residue** — what a resolved ticket leaves behind: a property test + a lineage fragment + an OKF concept.
- **OKF** — Open Knowledge Format; the markdown-concept knowledge bundle in `knowledge/`.
- **op_ts / pos / csn** — OGG CDC ordering markers (source-trail ts / trail position / commit sequence number).
- **⚠️ boundary** — the single function (`lineage`) allowed to read the C# Web API; converts it to typed edges.

---

## 17. Provenance of this work (so you know what's settled vs proposed)

- The **descent protocol, the F# discipline, the architecture, and the OKF integration** were built by the
  prior instance with the user; the **shrink technique was the user's own idea**, formalized here.
- The **ES/OGG/Kafka/Claude-Code/ddmin/OKF specifics** are research-grounded against official docs (§12), with
  version-drift caveats to verify.
- A competing GPT-authored runbook was used only as a cross-check for the *operational scaffold* (repo layout,
  evidence template, decision table); the intellectual core is independent and the Shrink is absent from it.
- Everything env-specific (endpoints, lineage, hosts, OKF concepts beyond the seeds) is **deliberately
  stubbed** for the user to populate from source — that is precisely the surface where you can exceed the
  prior instance, because you will have source and environment access it did not.

> **Your first move:** confirm the §13 forks with the user, then start §14 stage 1 against non-prod. Keep the
> §0 invariants. Match the level here, then push past it by turning theory into verified fact about this
> specific pipeline.
