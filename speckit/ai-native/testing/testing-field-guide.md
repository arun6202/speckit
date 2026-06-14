# The Testing Stack — Field Guide

**REST API + UI/E2E testing · consolidated, language- and project-agnostic · capabilities checked June 2026**

This is the detailed companion to the tabbed HTML guide. It expands every section with deeper per-tool notes. Tools are named as representative exemplars — the *role* is what matters, and every role has equivalents in every language. Popularity figures, download counts, and benchmark percentages are deliberately omitted; they go stale and are rarely primary-sourced. See `sources.md` for primary references.

---

## Contents

1. [Overview — the map](#1-overview--the-map)
2. [The four layers](#2-the-four-layers)
3. [API testing — the landscape](#3-api-testing--the-landscape)
4. [UI & end-to-end](#4-ui--end-to-end)
5. [AI-native testing](#5-ai-native-testing)
6. [Patterns & anti-patterns](#6-patterns--anti-patterns)
7. [Appendix — sources](#7-appendix--sources)

---

## 1. Overview — the map

Testing is not one activity but a **stack of distinct questions**, each answered by a different kind of tool, each blind to what the next one sees.

### Each layer answers one question, and leaves one gap

| # | Layer (exemplars) | Question | Scope | Source of truth | Blind spot |
|---|---|---|---|---|---|
| 01 | Unit / logic — *xUnit, JUnit, pytest, NUnit, Jest, go test* | Does my logic work? | a unit, in isolation | your assertions | the deployed contract may still be wrong |
| 02 | Spec-derived — *Schemathesis, CATS, RESTler, EvoMaster* | Does my API survive every input the spec implies? | one running endpoint | the spec | tests the spec's world, not real consumers' needs |
| 03 | Contract — *Pact, Spring Cloud Contract, Microcks* | Does my API still satisfy real consumers? | provider ↔ consumer | your consumers | validates shape, not the rendered journey |
| 04 | End-to-end — *Playwright, Cypress, Selenium* | Does the full UI journey work? | the whole stack | a real user | slow & costly — can't carry edge-case breadth |

**The chain that matters:** `logic is correct ≠ inputs are handled ≠ consumers are satisfied ≠ the journey works`. These are four different claims. None implies the next.

### Two axes organize everything

**Axis 1 — Trust vs. Proof.** Every API tool sits between two poles. At one end you author each example by hand and the tool faithfully replays it — it *trusts* what you gave it. At the other, the tool reads your OpenAPI/GraphQL contract and *derives* the cases, hunting inputs you would never think to write — it *proves* conformance. UI testing never faced this choice: the rendered browser is the oracle. For APIs, the spec is the oracle, and tools differ almost entirely by how seriously they take it. **Neither end is "better"** — exploration and collaboration genuinely live on the left; regression confidence lives on the right.

```
trusts your examples  ◂─────────────────────────────────────▸  proves against the spec

Postman · Bruno      REST Assured        Dredd          CATS · RESTler    Schemathesis
Insomnia             Karate              (conformance)  (generated         EvoMaster
(author by hand)     (coded examples)                   negatives)        (property-based)
```

**Axis 2 — The pyramid economics.** Confidence has a price. Keep most tests where they are fast and cheap; spend the slow, expensive layers only where they are irreplaceable.

- **Base — unit / component:** many · milliseconds · cheap (widest coverage, narrowest scope)
- **Middle — API / contract / spec-derived fuzz:** fewer · seconds · the efficient layer that catches integration bugs
- **Top — end-to-end:** few · minutes · costly (highest confidence, narrowest breadth)

Inverting this (many E2E, few unit) is the **"ice-cream cone"** anti-pattern — slow, flaky suites with poor failure localization.

---

## 2. The four layers

Each layer discharges one class of doubt and leaves another untouched. Every blind spot below is exactly what the next layer exists to catch.

### 01 · Unit / logic tests — *Does my logic work?*
- **Scope:** a single unit, in isolation. **Truth:** your assertions.
- **Proves:** branching, calculations, and transformations behave exactly as specified — for inputs you chose, with collaborators mocked. Fast, deterministic, white-box; runs on every save.
- **Blind spot:** *mocks can lie.* A green run says nothing about whether the transport layer wires the unit up, whether the running service matches its spec, or whether anyone downstream can call it. **Logic-correct + integration-broken** is the classic trap.

> Hands off to **spec-derived testing**: does the live endpoint actually hold up?

### 02 · Spec-derived property / fuzz — *Does my API survive every input the spec implies?*
- **Scope:** one running endpoint, black-box. **Truth:** the spec.
- **Proves:** the live service handles the whole input space the OpenAPI/GraphQL spec describes — valid, malformed, boundary, nulls, oversized, odd encodings — without server errors, returning schema-conformant bodies and documented status codes. Cases are generated from the contract, so they adapt automatically when it changes.
- **Blind spot:** it only knows *the spec*. Where the spec is wrong or thin, generation is blind there too — and it explores the space the spec *describes*, not the slice real consumers depend on.

> Hands off to **contract testing**: what do real callers actually rely on?

### 03 · Consumer-driven contracts — *Does my API still satisfy real consumers?*
- **Scope:** the provider ↔ consumer boundary. **Truth:** your consumers.
- **Proves:** every change still matches the exact requests each consumer sends and the responses it expects, recorded from real consumer code. Rename a field, change a type, or drop an endpoint, and it fails *here* — in your pipeline — instead of in their production. A deploy gate can block any version that would break a consumer in the target environment.
- **Blind spot:** it verifies the *shape* of the interaction, not its *meaning*. A provider can satisfy the contract and still return logically wrong data — and a contract says nothing about whether the full journey holds.

> Hands off to **end-to-end**: does the whole thing work for a real user?

### 04 · End-to-end (browser) — *Does the full UI journey work?*
- **Scope:** the whole stack, real browser. **Truth:** a real user.
- **Proves:** complete journeys (sign in, search, add to cart, check out) run against the real frontend and backend together, catching integration failures that only surface when everything is wired up live.
- **Blind spot:** slow, costly, brittle if undisciplined — so you can only afford a handful of critical paths. High confidence, narrow breadth. Edge-case coverage must live in the layers above.

> Closes the loop: layers 01–03 exist precisely because this layer can't carry breadth.

**The synthesis:** four *different questions* that happen to widen in scope. As you descend, truth shifts from your assertions → the spec → your consumers → a real user, and each step costs more. Each layer is **necessary**; none is **sufficient**.

---

## 3. API testing — the landscape

There is no single Playwright-style monarch for REST APIs. The winning model is a **stack**: the contract as the source of truth, plus the right executor for coded regression, generated negatives, consumer contracts, mocks, and CI.

### The contract — source of truth, not a test runner

**OpenAPI / Swagger** — the language-agnostic description of your API (endpoints, parameters, request/response schemas). *Not a test framework* — it's the contract every other tool consumes: docs, codegen, mock seed, validation input, AI/tooling interface. Strongest when **generated from code and versioned in CI**. "Swagger" now refers to the tooling ecosystem; OpenAPI is the spec (2.0 / 3.0 / 3.1).

**Spectral** (Stoplight) — lints the *spec itself* with built-in OpenAPI/AsyncAPI rulesets plus custom rules: enforce naming, require descriptions, mandate error schemas, ban deprecated patterns. The first CI gate — if the spec is broken, docs, SDKs, contract tests, and mocks are all broken too.

### Example-based — you author, it replays (trust)

**Postman** — the category default: collections, environments, mocks, monitors, JS test scripts. For CI, the signed **Postman CLI** is the modern runner; **Newman** is the legacy open-source collection runner. *Context:* a 2026 change ended team collaboration on the free tier, which became a tailwind for git-native clients. Collection runs and mock usage became unlimited across plans.

**Bruno** — git-native, offline-first: collections are **plain-text files** stored on the filesystem that diff in a pull request. No account, no cloud sync (none planned); collaboration is via Git, so existing repo permissions apply. Ships a CLI with JUnit XML output and Docker images for CI. Covers REST and GraphQL; no mock servers/monitors.

**Insomnia** (Kong) — cross-platform client for REST, GraphQL, gRPC, WebSockets, SSE. Design-first workflows with a native OpenAPI editor and visual preview; **Inso CLI** brings linting/validation and suite runs into CI. Storage via Local Vault, Git Sync, or Cloud Sync.

**REST Assured** — the JVM standard: a fluent **given/when/then** DSL with deep JSON/XML assertions (GPath), Hamcrest matchers, and JUnit/TestNG integration. Tests live as code in the repo — type-safe and refactorable, at the cost of boilerplate; reporting is bolt-on.

**Karate** — a Gherkin-like DSL with **no step-definitions required**; JSON and XML are native data types, so full-payload assertions work out of the box. Bundles API tests, schema validation, service mocking, performance hooks, and parallel execution. Accessible to testers without a Java background; its browser automation trails dedicated tools.

### Conformance & spec-derived — it derives, it proves (proof)

**Dredd** — a language-agnostic CLI that reads the spec and checks the **live API matches it endpoint-by-endpoint** (status, headers, body shape via JSON Schema). Hooks (in several languages) handle auth, setup/teardown, and skipping. By default tests only 2xx responses. Validates *documented* behaviour; does not generate adversarial data.

**Schemathesis** — converts an OpenAPI/GraphQL schema into **property-based tests** (built on Hypothesis), generating valid + adversarial inputs and checking each response against the contract with **zero per-endpoint maintenance**; tests adapt when the schema changes.
- **Checks:** `not_a_server_error`, `status_code_conformance`, `content_type_conformance`, `response_headers_conformance`, `response_schema_conformance`, `negative_data_rejection`, `ignored_auth`.
- **Stateful testing** for create→get→delete workflows; shrinks each failure to a minimal reproducer and emits a `curl` command.
- **CLI / CI:** run via the CLI (or as a library); exports **JUnit XML**; official **GitHub Action**; works with pytest, GitLab CI, Jenkins.

```bash
# Point it at the contract; let it generate and prove conformance
schemathesis run ./openapi.yaml --url http://localhost:8080 --checks all

# In CI: standard exit codes + JUnit XML gate the pipeline
schemathesis run ./openapi.yaml --report junit --checks all --max-failures 1
```

**CATS** — JVM CLI fuzzer that auto-generates negative/edge tests from the contract with **near-zero maintenance** (malformed, boundary, zero-width inputs); in context mode also validates responses against the spec.

**RESTler** (Microsoft Research) — the first **stateful** REST fuzzer: analyzes the whole spec, **infers producer–consumer dependencies** among requests, and generates request *sequences* to reach deeper service states. Modes: `test` (smoke/coverage), `fuzz-lean`, `fuzz` (aggressive). Surfaces security and reliability bugs.

**EvoMaster** — AI/search-based system-level generator; uniquely supports **white-box** testing (analysing the service to maximise code coverage via evolutionary algorithms) as well as black-box. Covers REST, GraphQL, RPC; outputs runnable test suites. Independent academic studies repeatedly rank it among the best on coverage and fault detection. Note: CATS, RESTler, and Schemathesis are black-box; only EvoMaster offers white-box.

### Contracts — protect your consumers

**Pact** — the de-facto standard for **consumer-driven contracts**. Workflow:
1. **Consumer test** — the consumer writes tests against a Pact mock provider; running them generates a **pact file** (JSON contract).
2. **Broker / PactFlow** — the contract is published and versioned by consumer/provider, with branch/environment metadata.
3. **Provider verification** — the provider fetches applicable pacts and verifies against its real implementation; **state handlers** set up required data.
4. **`can-i-deploy`** — the **release gate**: queries the compatibility matrix and answers whether a version is safe to deploy with everything currently in the target environment.
- Also supports **message/event contracts** (Kafka, RabbitMQ, SNS/SQS). Guidance: use Pact as a *mock* (calls verified), keep contracts as loose as possible while still catching breaking changes, and avoid over-contracting full payloads. Pending/WIP pacts stop new consumer expectations from breaking provider builds.

**Spring Cloud Contract** — contract testing for the Spring/JVM ecosystem; can use OpenAPI as the contract source. Natural fit for Spring microservice fleets.

**Microcks** — Kubernetes-native mocking + **conformance testing** from OpenAPI/AsyncAPI/GraphQL/gRPC and Postman collections; auto-creates high-fidelity mocks from examples and runs tests against real endpoints. A **provider-driven** counterpart to Pact's consumer-driven model.

### Supporting — mocks & real dependencies

**WireMock / WireMock.Net** — HTTP stubbing and service virtualization. Match on URL/headers/cookies/body (first-class JSON/XML); **fault injection** (`EMPTY_RESPONSE`, `MALFORMED_RESPONSE_CHUNK`, `RANDOM_DATA_THEN_CLOSE`, `CONNECTION_RESET_BY_PEER`), **latency injection**, record/playback by proxying a real service, conditional proxying, and **stateful** scenario state machines. Critical for **deterministic CI** when downstreams are missing, flaky, paid, slow, or hard to reset. The .NET port carries the same core plus OpenAPI/GraphQL/gRPC/WebSockets extras.

**Testcontainers** — throwaway Docker containers as test fixtures (real databases, brokers, search, browsers) so integration tests run against **real dependencies instead of mocks**. Manages lifecycle (start before, destroy after), is parallel-safe (no port conflicts), and gives a consistent local/CI experience. Available across many languages; requires a Docker-compatible runtime.

### Adjacent — different problems, don't conflate

**Performance / load** — *k6* (Go engine, JS/TS scripts, CLI-first, thresholds gate CI), *Gatling* (JVM, very high VU density, strong HTML reports), *JMeter* (broadest protocol support, GUI, XML plans), *Locust* (Python, tests as plain classes), *NBomber* (.NET). They answer "how does it behave under traffic," not "is it correct." **Never compare raw numbers across tools** — they measure timing differently; re-baseline when migrating.

**API security** — *OWASP ZAP* (open-source DAST; can seed scanning from an OpenAPI/GraphQL definition; `zap-baseline.py` / `zap-api-scan.py` in CI) and *42Crunch* (static spec **Audit** score + dynamic **Conformance Scan** for OWASP API Top 10). **Functional tests do not replace security tests** — generic scanners miss authorization flaws (e.g., broken object-level authorization) without API context.

**The verdict:** API quality is an **ecosystem, not a tool** — OpenAPI is the map, coded/integration tests are the truth, contract tests protect consumers, spec-derived tests attack the edges, mocks control chaos, and CI enforces discipline. Choose each executor by the *job to be done* and your team's language, not by hype.

---

## 4. UI & end-to-end

Unlike APIs, UI testing has a clear modern default. The crown passed twice, and each handover turned on a single capability the incumbent couldn't offer.

### The line of succession

| Era | Tool | Added | What cost it the lead |
|---|---|---|---|
| 2004 · WebDriver | **Selenium** *(founder)* | Standardised browser automation (now W3C WebDriver); broadest language/browser reach. | A protocol layer between test and browser — slower, flaky unless you scatter explicit waits. |
| 2017 | **Cypress** *(reformer)* | In-browser execution, time-travel debugging, exceptional DX. | Running inside the browser is a cage — historically Chromium-bound; awkward cross-origin/multi-tab. |
| 2020 · **current** | **Playwright** *(default)* | Out-of-process control, cross-browser, cross-language — and **auto-waiting**. | — (reigning) |
| 2026 · forming | **Agents** *(heir)* | Drive the browser via accessibility-tree snapshots; can author tests. | Open question; see §5. |

### The decisive move — the war on flakiness

Every earlier framework asked you to manage time by hand: sleep, poll, retry, pray. The modern fix is to **make the tool wait, not the human**. Before any action, Playwright runs **actionability checks** — element attached, *visible*, *stable* (same bounding box across two animation frames), *enabled*, and able to *receive events* — and its **web-first assertions retry** until the condition holds or the timeout expires.

```js
// Old way — you babysit the clock, and pray it's enough
await driver.wait(until.elementLocated(locator), 5000);
await driver.sleep(500);

// Modern way — the tool waits for actionability; the assertion retries
await page.getByRole('button', { name: 'Checkout' }).click();
await expect(page.getByText('Order placed')).toBeVisible();
```

### The crown jewels (Playwright)

- **Auto-wait + web-first assertions** — actionability gates every interaction; assertions poll until met.
- **Browser contexts** — near-instant, fully isolated sessions; clean state and parallelism without a grid. `storageState` reuses auth.
- **Out-of-process control** — a persistent connection to browser internals instead of per-command protocol round-trips; the basis of the speed advantage.
- **Cross-browser & cross-language** — Chromium, Firefox, WebKit (real Safari engine); official bindings for **TypeScript/JavaScript, Python, Java, .NET**.
- **Trace Viewer · Codegen · UI Mode** — scrub a run frame-by-frame with DOM/console/network; generate selectors by clicking; time-travel watch mode.
- **Network interception + component testing** — route, stub, and assert on requests; mount components in isolation; built-in screenshot comparison; an API-request client.

### Locator strategy — the real flake killer

Selector breakage is the biggest long-term maintenance cost. Prefer **user-facing, semantic locators** backed by accessible HTML; treat `data-testid` as an explicit contract; reach for CSS/XPath last.

| Priority | Locator | Use when | Risk |
|---|---|---|---|
| 1 | `getByRole` | Buttons, links, headings, dialogs, menu items with accessible names. | Needs semantic HTML + stable accessible name. |
| 2 | `getByLabel` | Form inputs where labels reflect user intent. | Breaks if labels are missing/fake. |
| 3 | `getByText` | Stable messages, headings, visible business labels. | Localization & copy changes. |
| 4 | `getByTestId` | Repeated rows/cards, icon-only controls, complex widgets. | Drifts unless treated as a real contract. |
| 5 | CSS | Stable app-specific attributes; rare fallbacks. | Classes & DOM structure change often. |
| last | XPath / `nth()` | Only when trapped by poor DOM and no contract is possible. | High maintenance; invisible coupling to layout. |

**Rule:** if a locator breaks, ask whether product accessibility or the test contract broke — don't blindly add a longer wait.

### The court — where rivals still hold ground

- **Selenium** — the W3C-standard estate: widest language/browser footprint, mature grid infrastructure, and (via Appium) native mobile. Migrating toward WebDriver BiDi.
- **Cypress** — still the most pleasant in-browser DX and a mature component-testing story for Chromium-based frontend teams. Each test is bound to a single superdomain (`cy.origin()` for cross-origin); can't drive two browsers at once.
- **WebdriverIO** — a flexible Node test framework over WebDriver/BiDi with a rich plugin ecosystem; combines web and (through Appium) mobile.
- **Puppeteer** — the Chromium-focused predecessor (Chrome team); now with WebDriver BiDi support. New capabilities tend to land in Playwright first.
- **Appium** — real-device and native/hybrid mobile automation across Android and iOS over the WebDriver protocol — the domain web-only tools structurally can't enter.

### Beneath end-to-end — the cheaper layers

- **Testing Library + Vitest/Jest** — query the DOM the way a user would (role, label, text); avoid implementation details. Use *before* full E2E when a browser journey isn't required.
- **MSW (Mock Service Worker)** — intercepts requests at the network level, so the **same mock definitions** work across unit, integration, E2E, and local dev — framework- and client-agnostic.
- **Visual regression** — *Percy* and *Chromatic* add cross-browser baselines and a review/approval UI; Playwright's built-in `toHaveScreenshot()` needs no service. Screenshot only **stable, high-value** surfaces, with masks, on a pinned render environment.
- **axe-core** (Deque) — catches obvious WCAG regressions in CI while keeping selectors close to user intent. A guardrail, not a full audit; automated checks cover only part of accessibility.
- **WebDriver BiDi** — the emerging W3C bidirectional protocol (WebDriver's standardization + CDP-like real-time events). Selenium, WebdriverIO, and Puppeteer already adopt it; the likely convergence point.

**Architecture principle:** a good UI test is not "click-click-click-pass." It is a **small executable business claim** ("a seller can publish a product," "an inactive user cannot access billing," "search returns the indexed product after sync"). Design around journeys, stable selectors, clean data, and fast failure diagnosis — and don't crown the recorder; generated scripts are a starting point, not an architecture.

---

## 5. AI-native testing

The newest layer points agents at the browser. It is genuinely useful for discovery and drafting — and unreliable as a source of truth.

### How agents drive the browser

The bridge between coding agents and the browser exposes the page as a **structured accessibility-tree snapshot rather than pixels**. Each interactive element gets a stable reference — fast, vision-free, deterministic, and far cheaper to reason over than a screenshot or raw DOM. An agent can navigate, fill forms, intercept network, and author tests in natural language, registered into an agent client (VS Code, Cursor, Claude Desktop, Windsurf) with a one-line configuration. For stateful, iterative loops a server interface fits; high-throughput coding agents can be more token-efficient with a CLI + skills workflow.

### The line humans must hold

**Where AI helps:** convert acceptance criteria into candidate cases; explore flows and draft first-pass scripts; inspect page state and reproduce defects; summarise trace failures into likely root causes; scaffold data factories, API clients, and fixtures.

**Where humans stay in control:** deciding business-critical **assertions**; choosing stable **locator contracts**; designing **data isolation** and cleanup; separating unit/component/API/E2E concerns; approving **security, payment, and destructive** flows.

### Why the oracle can't be delegated yet

Research evaluating computer-use agents on end-to-end web testing consistently finds **insufficient test completeness, weak defect detection, and unreliable long-horizon interaction**. Field studies show agents producing many **false positives** — often misattributing browser-automation limits (e.g., a blocked download) to defects in the site. The qualitative conclusion across independent studies is that human oversight remains necessary; treat specific benchmark numbers as preliminary.

**Prompt the agent like an engineer, not a wish:**

- ✅ *Good* — "Given this acceptance criterion: *a suspended user cannot create an order and sees a support message.* Generate tests that use role/label locators first; create the suspended user via an API fixture; reuse saved auth state; assert on the blocked button and the message; use no fixed waits; and name steps for tracing."
- ❌ *Bad* — "Open the site and write all the tests. Use whatever selectors work. Make it pass." → selector soup, happy-path bias, missing assertions, brittle timing hacks.

**The honest rule:** let AI accelerate discovery and boilerplate; do **not** let it be the oracle. A test without a precise, human-owned assertion is just browser choreography.

---

## 6. Patterns & anti-patterns

The difference between a suite that protects you and one that performs testing theatre is rarely the tool. It's what you choose to prove, how you stage it, and the patterns you enforce.

### What serious API tests must prove

| Dimension | What to test | Example assertion |
|---|---|---|
| Resource lifecycle | Create → read → update → search → delete | Created resource returned by GET; delete changes visibility; search catches up after sync. |
| Status semantics | Correct 2xx/4xx/5xx — not just "200" | Validation → 422; duplicate key → 409; unauthenticated → 401; unauthorized → 403. |
| Schema conformance | Request/response shape, required fields, enums, formats | No undocumented fields; no missing required fields; date/time format stable. |
| Business invariants | Rules beyond schema | Price can't go negative; a settled order can't be edited; only legal status transitions. |
| Authorization matrix | Role · tenant · scope · ownership | Tenant A can't read tenant B; a read-only token can't mutate. |
| Idempotency | Repeated POST/PUT/PATCH, idempotency keys | Same key → same result; duplicate create doesn't double-charge. |
| Concurrency | Races, optimistic locking, ETag/If-Match | Two updates: one succeeds, one gets 409/412. |
| Eventual consistency | Write → propagate to search/read-model | Poll with a bounded timeout; verify index doc; no stale deleted record. |
| Observability | Correlation IDs, audit logs, traces | Response carries a correlation ID; audit record created; error logged once. |
| Fault tolerance | Downstream timeout, retry, circuit breaker | Returns a safe error; no duplicate side effect after retry. |

### A CI pipeline that stages confidence

1. **Spec gate** — lint the spec; diff for breaking changes; compile generated clients. *Fail on* removed fields/endpoints, changed types, status-code drift.
2. **Integration** — boot the service in a test host with real containerized dependencies. *Verify* lifecycle, authz, invariants against real infra.
3. **Functional flows** — coded regression: create → read → update → search → delete with side-effect checks. *Verify* business workflows end-to-end at the API level.
4. **Contract + fuzz** — provider contract verification; spec-derived negative/property testing. *Gate* on `can-i-deploy` green and no server-error/schema-conformance failures.
5. **Release smoke** — minimal critical-path checks against the deployed environment.

### End-to-end patterns that separate real suites from demos

- **API-seed, UI-assert** — create preconditions through the API, verify through the UI. Faster and less brittle than seeding state by clicking.
- **storageState auth** — log in once per role, reuse the saved session.
- **Fixtures over globals** — inject page objects, API clients, tenants, users, and cleanup as fixtures.
- **Test by role** — admin, viewer, seller, approver as explicit roles; model multi-user flows with isolated sessions.
- **Network-aware assertions** — wait for the specific response or state change when the UI alone is ambiguous; never a fixed sleep.
- **Trace on retry** — keep trace/video/screenshot on first retry or failure; fix the root cause, not the timeout number.
- **Contractual test IDs** — when you need a test ID, make it a stable product contract, not a random implementation leftover.
- **Minimal visual checks** — screenshot high-value, stable surfaces only, with masks.
- **Flake quarantine** — a temporary safety valve with an owner and a ticket, not a graveyard.

> Don't over-apply the Page Object Model: it helps when it hides stable domain actions; it harms when it hides assertions, creates giant inheritance trees, or turns every locator into ceremony.

### Anti-patterns — garbage in, garbage out

**API testing smells**
- *Swagger theatre* — a spec nobody verifies against the implementation.
- Only asserting status 200/201.
- A shared, dirty test environment with mutable data.
- Collections live in someone's cloud workspace, not reviewed like code.
- No negative tests for invalid values, missing auth, wrong tenant, duplicate keys.
- Unverified mocks that drift from real provider behaviour.
- Tests depend on order and can't run in parallel.

**UI testing smells**
- Recorded scripts checked in directly — brittle, selector-coupled flows.
- Hard waits / fixed sleeps; timeouts that keep growing.
- One mega-test per module — late failure hides the cause.
- Shared mutable data — passes alone, fails as a suite.
- Testing implementation details — fails after a harmless refactor.
- Screenshots everywhere — baseline churn, ignored failures.
- Retry-as-quality — green builds hiding real nondeterminism.

### Choose by the job, not the hype

| Job to be done | First choice | Why | Common trap |
|---|---|---|---|
| Explore an API & share examples | Client (Postman / Bruno / Insomnia) | Fast discovery, environments, auth, examples. | Calling exploratory collections "automation." |
| Coded API regression with flows | Coded DSL (Karate / REST Assured) or in-process integration | Readable, refactorable scenarios with setup. | Giant chains that fail for unrelated reasons. |
| Spec conformance & negatives | Schemathesis (+ CATS / RESTler) | Spec-driven coverage and automatic edge cases. | Assuming schema validation equals business correctness. |
| Protect downstream consumers | Pact | Captures real consumer expectations; gates release. | Provider team ignoring consumer contracts. |
| Deterministic downstreams | WireMock + Testcontainers | Fault/latency injection; real deps where it matters. | Mocks drifting from provider reality. |
| Serious web E2E suite | Playwright | Isolation, cross-browser, traces, retries, parallelism. | Starting with a legacy tool "because we always did." |
| Component behaviour | Testing Library + Vitest/Jest | Cheaper, faster, closer to component logic. | Full browser E2E for every dropdown. |
| Native mobile | Appium | Real-device automation web tools can't reach. | Expecting a web-only tool to cover mobile. |
| Load / throughput | k6 / Gatling (JMeter / Locust / NBomber) | A different problem: saturation, not correctness. | Using functional tools as load tools. |
| Security baseline | OWASP ZAP / 42Crunch | Authz, injection, headers, schema risk. | Thinking functional tests replace security tests. |

### Maturity — four pillars to assess (not a score)

- **Spec discipline** — spec generated or reviewed, linted, diffed for breaking changes, with generated clients and realistic examples.
- **Functional truth** — lifecycle flows, business invariants, the authorization matrix, and data isolation are actually exercised.
- **Contract & resilience** — consumer contracts, fault simulation, idempotency, and concurrency are covered, not assumed.
- **Automation quality** — CI gates, parallelism, traceable failure categories, and disciplined flake control; tests owned as production code.

---

## 7. Appendix — sources

Full link list in `sources.md`. Primary documentation and project pages, **checked June 2026**. Prefer official docs over blogs; recheck before relying on version-specific details. This guide describes qualitative leadership and documented capabilities rather than adoption percentages, download counts, or benchmark figures — those are frequently vendor-sourced, version-specific, and quickly outdated.
