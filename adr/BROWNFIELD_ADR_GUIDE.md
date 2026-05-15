# Decision-Driven Evolution: A Guide for Brownfield ADRs

## 1. The Brownfield Paradox
In greenfield projects, **Spec-Driven Development (SDD)** works because you can define intent before code. In brownfield projects, an "organization push" for SpecKit often feels futile because:
- **Intent is Buried:** Business logic is hidden in 10-year-old SQL scripts or undocumented C# patches.
- **False Clarity:** AI-generated specs based on fragmented legacy code create a dangerous "illusion of truth."
- **High Friction:** Forcing a `Constitution -> Spec -> Plan -> Code` workflow on a system with massive technical debt slows down velocity without proportional quality gains.

**The Solution:** Transition from Spec-Driven Development to **Decision-Driven Evolution (DDE)** using a lightweight, ADR-first approach.

---

## 2. Core Concepts for Brownfield ADRs

### A. The "Baseline" ADR (ADR 0001)
Instead of a 50-page "Constitution," create a **State of the Union** record.
- **What it covers:** The current tech stack, primary architectural patterns (even the bad ones), and "known-knowns."
- **Goal:** Acknowledge the reality you are starting from.

### B. Retroactive ADRs (The Archaeological Record)
Don't document the past for the sake of it. Document it when you "uncover" a mystery.
- **Trigger:** You spend 4 hours debugging why a specific service uses a custom serializer instead of the standard one.
- **Action:** Write a short ADR: *"We discovered that Service X uses CustomSerializer because the 2018 version of Library Y lacked support for Z. We are maintaining this for backward compatibility with Legacy System Q."*
- **Benefit:** The next developer saves those 4 hours.

### C. The "Golden Path" ADR (Consolidating Patterns)
Legacy systems often have 3 ways to do the same thing (e.g., 3 HTTP clients, 2 logging frameworks).
- **Action:** Explicitly document which pattern is the **Preferred Path** moving forward.
- **Rule:** "We have three ways to log. New modules **must** use Pattern A. Pattern B is deprecated. Pattern C is legacy-only."

### D. Deprecation & Supersession
In brownfield, your most important status is `Superseded`.
- When a new decision replaces an old one, link them. This creates a "decision trail" that explains the evolution of the system.

---

## 3. Beyond ADRs: RFCs and Design Docs

For a brownfield project, an ADR might be too small for big changes. Use these complementary tools:

| Tool | Purpose | When to use? |
| :--- | :--- | :--- |
| **ADR (Architectural Decision Record)** | To record a **decision** and its rationale. | "We decided to use Redis for caching." |
| **RFC (Request for Comments)** | To **propose** a major change and gather feedback. | "How should we replace the legacy auth system?" |
| **Design Doc / Blueprint** | To **describe** a complex system's architecture. | "The end-to-end flow of the Billing engine." |
| **Constitution (SpecKit)** | To **enforce** high-level laws/principles. | "No PII in logs," "80% test coverage." |

---

## 4. The Hybrid Workflow: "Spec-Lite"
If the organization is pushing SpecKit, don't fight it—**pivot** it. Use a "Spec-Lite" approach:

1.  **High-Level Constitution:** Keep it limited to "Laws" (e.g., your `rules.md`).
2.  **ADR as the "Why":** Use ADRs to document the architectural forks in the road.
3.  **Specs for "New Growth" Only:** Only write full SpecKit specs for entirely new modules or massive refactors.
4.  **The "考古" (Archeology) PR:** Encourage PRs that *only* add documentation (ADRs/READMEs) to legacy folders without changing code.

---

## 5. Implementation Strategy

1.  **Folder Structure:** 
    - `/adr` for architectural decisions.
    - `/rfc` for proposed major changes.
    - `/docs` for blueprints and long-form context.
2.  **Integration with Git:**
    - ADRs are markdown files in the repo.
    - PRs that introduce new patterns **must** include an ADR.
3.  **The 15-Minute Rule:**
    - If a decision takes more than 15 minutes to explain to a peer, it deserves an ADR.
    - If an archeological discovery takes more than 15 minutes to find, it deserves a retroactive ADR.

---

## 6. Summary Checklist
- [ ] Have we documented the "Baseline" (ADR 0001)?
- [ ] Is there a "Golden Path" for common patterns?
- [ ] are we using `Superseded` to track migrations?
- [ ] are we prioritizing "Read before Write" in legacy modules?

**Remember:** Documentation in brownfield projects isn't about being "perfect"—it's about being **less confused tomorrow than you are today.**
