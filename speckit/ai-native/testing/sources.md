# Sources — The Testing Stack Field Guide

**Checked: June 2026.** Primary documentation and project pages, organized by topic. Prefer official docs over blogs; recheck dates before relying on version-specific details.

> **A note on numbers.** This guide deliberately omits adoption percentages, GitHub stars, npm download counts, and benchmark figures. They are frequently vendor-sourced, version-specific, and quickly outdated — verify them yourself, at the source, on the day you need them. What's cited below are capability and design references, not popularity claims.

---

## Specification & governance

- **OpenAPI Initiative** — https://www.openapis.org/ · spec: https://spec.openapis.org/
- **Spectral** (Stoplight) — https://github.com/stoplightio/spectral · https://meta.stoplight.io/docs/spectral

## Spec-derived property / fuzz testing

- **Schemathesis** — https://schemathesis.io/ · https://github.com/schemathesis/schemathesis · paper "Deriving Semantics-Aware Fuzzers from Web API Schemas": https://arxiv.org/abs/2112.10328
- **EvoMaster** — https://github.com/WebFuzzing/EvoMaster · tool report: https://link.springer.com/article/10.1007/s10515-024-00478-1
- **RESTler** (Microsoft Research) — https://github.com/microsoft/restler-fuzzer
- **CATS** — https://github.com/Endava/cats

## Contract testing & mocking

- **Pact** — consumer: https://docs.pact.io/consumer · broker: https://docs.pact.io/pact_broker · https://github.com/pact-foundation/pact_broker · PactFlow: https://docs.pactflow.io/
- **Spring Cloud Contract** — https://spring.io/projects/spring-cloud-contract
- **Microcks** — https://microcks.io/ · https://github.com/microcks
- **WireMock / WireMock.Net** — https://wiremock.org/ · https://github.com/wiremock/wiremock · https://github.com/wiremock/WireMock.Net

## Conformance & API clients / DSLs

- **Dredd** — https://dredd.org/ · https://github.com/apiaryio/dredd
- **REST Assured** — https://rest-assured.io/ · https://github.com/rest-assured/rest-assured
- **Karate** — https://github.com/karatelabs/karate · https://karatelabs.github.io/karate/
- **Postman** (plans / CLI vs Newman) — https://learning.postman.com/docs/billing/about-plans · https://learning.postman.com/docs/postman-cli/postman-cli-overview/
- **Bruno** — https://www.usebruno.com/ · https://docs.usebruno.com/ · https://github.com/usebruno/bruno
- **Insomnia** (Kong) — https://github.com/Kong/insomnia · https://developer.konghq.com/insomnia/

## Integration, performance, security

- **Testcontainers** — https://testcontainers.com/ · https://java.testcontainers.org/
- **k6** — https://k6.io/ · **Gatling** — https://gatling.io/ · **JMeter** — https://jmeter.apache.org/ · **Locust** — https://locust.io/ · **NBomber** — https://nbomber.com/
- **OWASP ZAP** — https://www.zaproxy.org/
- **42Crunch** — https://42crunch.com/

## UI / E2E frameworks

- **Playwright** — https://playwright.dev/ · actionability: https://playwright.dev/docs/actionability · locators: https://playwright.dev/docs/locators · best practices: https://playwright.dev/docs/best-practices · snapshots: https://playwright.dev/docs/test-snapshots · https://github.com/microsoft/playwright
- **Selenium** — https://www.selenium.dev/ · WebDriver BiDi: https://www.selenium.dev/documentation/webdriver/bidi/
- **Cypress** — https://docs.cypress.io/app/references/trade-offs · https://www.cypress.io/
- **WebdriverIO** — https://webdriver.io/
- **Puppeteer** — https://pptr.dev/ · WebDriver BiDi: https://pptr.dev/webdriver-bidi
- **Appium** — https://appium.io/ · https://github.com/appium/appium

## Component / unit · mocking · visual · accessibility · protocol

- **Testing Library** — https://testing-library.com/docs/guiding-principles
- **Vitest** — https://vitest.dev/ · https://github.com/vitest-dev/vitest
- **MSW (Mock Service Worker)** — https://mswjs.io/ · https://github.com/mswjs/msw
- **Percy** (BrowserStack) — https://www.browserstack.com/percy
- **Chromatic** — https://www.chromatic.com/
- **axe-core** (Deque) — https://github.com/dequelabs/axe-core · https://www.deque.com/axe/axe-core/
- **WebDriver BiDi** (W3C) — https://www.w3.org/TR/webdriver-bidi/ · https://github.com/w3c/webdriver-bidi · https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi

## Agentic / AI-native

- **Playwright MCP** — https://playwright.dev/docs/getting-started-mcp · https://github.com/microsoft/playwright-mcp
- **AI web-testing research** — WebProber: https://arxiv.org/abs/2509.05197 · WebSuite: https://arxiv.org/pdf/2406.01623

---

*Capability descriptions in the field guide are drawn from these references. Where a claim could not be confirmed from a primary source, the guide describes it qualitatively rather than asserting a number.*
