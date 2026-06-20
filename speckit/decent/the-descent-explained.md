# The Descent — A Plain-Language Guide

### How a disciplined, AI-assisted method turns "something's broken and nobody wrote it down" into a fast, safe, self-improving process.

This guide is for **everyone** — managers, analysts, business owners, support teams, and engineers. It explains *what* the approach is and *why it matters*, not the technical machinery underneath. No code, no jargon you won't be handed plainly.

---

## 1. The setup, in one picture

Picture a big company system built in three parts:

```
   THE LEDGER          →     THE CATALOG          →     THE FRONT DESK
   (Oracle)                  (Elasticsearch)            (the API)
   the official record       a fast, searchable copy    answers users' questions

                        ↑ couriers keep the catalog
                          up to date in real time
                          (GoldenGate + Kafka)
```

- **The Ledger** is the official source of truth — where the real data lives.
- **The Catalog** is a fast, searchable *copy* of that data, reshaped so it can be searched quickly. (Like a library's search catalog versus the actual shelves in the warehouse.)
- **The Front Desk** is the app/service that users and other systems ask questions of. Here's the twist: **users think they're talking to the Ledger, but the Front Desk is really reading from the Catalog.** They never see the copy underneath.
- **The Couriers** continuously carry changes from the Ledger to the Catalog so the copy stays current.

This is a common and sensible design — the copy makes things fast. But it creates a specific kind of problem.

---

## 2. The problem

Things go wrong, and people report them: *"I searched and got nothing, but I know that record exists."* Or: *"This number is out of date — I changed it a minute ago."*

Now the hard part. **There is no reliable documentation.** Nobody wrote down exactly how the Ledger becomes the Catalog, which search the Front Desk really runs, or where a particular number comes from. So when a complaint arrives, finding the cause has historically meant a few senior experts spelunking through the system from memory — slow, inconsistent, and risky if those experts are busy or leave.

The question this method answers: **how do you find the real cause of a defect, fast, without a map — and leave behind a map for next time?**

---

## 3. The big idea: don't map the whole system — *descend* to the problem

The instinct most teams have is to first document everything, then troubleshoot. That's expensive, and the documentation is stale the moment the system changes.

This method does the opposite. It treats each defect like a **diagnosis**. A good doctor doesn't re-examine your entire body for a sore wrist — they follow a focused sequence of checks and stop the moment they find the cause. An electrician tracing a dead outlet checks the outlet, then the wiring, then the breaker — and stops at the first thing that's broken.

That's "**the descent**": a fixed, sensible order of checks that goes **from the symptom the user sees, down through the layers, to the root cause — stopping at the first thing that's wrong.** Most problems are caught in the first few checks and never need a deep dive.

The checks, in plain terms:

1. **Understand the complaint.** Which app feature, which record, which environment (live or test)? What did they expect, what did they get?
2. **Reproduce it.** Run the user's exact request and see the bad result yourself. (If the request itself was malformed, the problem is on the asking side — done.)
3. **Trace where the answer comes from.** Follow the thread from the question back to the right piece of the Catalog and the right column in the Ledger.
4. **Check the Ledger.** Is the official source itself correct? If the Ledger is wrong, this is a *data* problem to escalate — not a software bug.
5. **Check the copy process.** Did the step that builds the Catalog produce the right value?
6. **Check the live-update path.** If the data is just *stale*, follow the couriers to find where the update got stuck.

Each step is a simple yes/no gate. Pass it, and you go one layer deeper. Fail it, and **you've found your answer — stop.**

---

## 4. The two signature moves

Two techniques do most of the work, and both are intuitive.

### The Shrink — "remove filters until the answer comes back"

This is the everyday case: someone runs a perfectly valid search — the right name, the right status, the right date range — and gets **nothing**, when the record clearly exists.

Anyone who's used a spreadsheet filter knows this feeling: you add one filter too many and suddenly all your rows vanish. The fix is obvious — **start removing filter conditions one at a time until the rows come back.** The condition you removed last is the one that was too strict, or quietly mismatched.

That's the Shrink. Instead of guessing, the method *systematically peels the search apart* until the data reappears, pinpointing the exact field or value that was silently killing the result. Then it explains *why* — usually a small mismatch like searching for "ACTIVE" when the stored value is "Active." Tiny cause, invisible effect, found in seconds instead of an afternoon.

### The Trace — "track the package to where it got stuck"

This is the *stale data* case: the Ledger is right, but the Front Desk shows an old value.

Think of tracking a parcel: **ordered → shipped → in transit → out for delivery → delivered.** When a package is late, you don't re-check the warehouse; you look at the tracking to see *where it stopped*. The Trace does exactly this with a data change: it follows the update from the Ledger, to the courier, to the temporary staging area, to the Catalog — and finds the one hop where it got stuck (delayed, dropped, or delivered out of order).

---

## 5. Why this is different — and significant

**It replaces a big, doomed documentation project with learning just-in-time.** You don't write a 200-page manual upfront (it would be wrong within weeks). You learn exactly what each defect requires, exactly when you need it.

**Every fix makes the system smarter.** This is the heart of it. Each time a problem is solved, the method *writes down what it learned* — what that field means, where it comes from, what went wrong, and how to catch it next time — into a shared, reusable knowledge library. The system **documents itself, one ticket at a time.** Repeated problems start triaging themselves. The knowledge compounds instead of evaporating.

**Knowledge stops living only in a few people's heads.** That "tribal knowledge" — the join paths, the gotchas, the lore — becomes a navigable, shared asset. The practical effect: less dependence on any one expert, easier onboarding, lower key-person risk.

---

## 6. Where AI fits — and how it stays safe

An AI assistant runs this method: it does the patient, tedious tracing a human would find draining, following the same disciplined descent every time. But the design keeps humans firmly in control through a few deliberate guardrails:

- **Look, never touch.** The AI's investigation is strictly *read-only* — in both live and test systems. It can inspect the Ledger, the Catalog, and the couriers, but it is structurally prevented from changing anything. (This is enforced in two independent ways, so a slip is caught.)
- **Humans approve every fix.** The AI proposes; a person reviews and authorizes any actual change, repair, or backfill. Risky or irreversible actions always pass through a human.
- **It checks its own work.** Before declaring a cause, the AI tries to *disprove* its own conclusion and must produce a small automated test that fails on the bug — so "I think it's this" becomes "here's proof it's this."
- **It plans before acting, remembers what it learned, uses small focused tools, and is tested against a set of known-hard cases.** These are standard reliability practices that keep an AI assistant dependable rather than improvisational.

The net effect: the AI brings *speed and consistency*; the humans keep *judgment and control*; and everything leaves a recorded trail.

---

## 7. The captured knowledge is portable, not locked in

The knowledge the method captures isn't trapped in one tool or one vendor's product. It's written in a simple, open, shareable format (plain documents anyone can read, that any tool or future AI can consume). That means:

- It can be read by a person, a search tool, a dashboard, or a different AI — without translation.
- It travels with the code, in version control, so it stays close to what it describes.
- It complements — rather than replaces — the formal data contracts and lineage systems a data team already runs. Think of it as the **plain-English layer** sitting on top of the technical definitions, linking to them rather than duplicating them.

---

## 8. What this means for your role

| If you are… | What you get from this |
|---|---|
| **A manager / leader** | Faster defect resolution, less reliance on a few irreplaceable experts, no costly upfront documentation project, and a consistent, auditable trail for every issue. Risk goes down; speed goes up. |
| **A business owner / sponsor** | The system's knowledge becomes a compounding asset instead of decaying tribal memory. Each problem solved makes the next one cheaper. Onboarding new people gets faster. |
| **An analyst** | When a query or report "returns nothing" or "looks wrong," there's a repeatable way to find exactly which field or filter caused it — the same instinct you use peeling back spreadsheet filters, made systematic. And you can trust the lineage: every served value can be traced back to its real source. |
| **A support / ops person** | A clear, step-by-step triage path for incoming tickets, so issues get routed and explained consistently — and a growing knowledge base so the same question isn't re-investigated from scratch. |
| **A programmer / engineer** | A disciplined, read-only investigation workflow with reusable tooling, strict separation between investigation and change, and an automatic regression test produced for every fix — so bugs found once stay fixed. |

---

## 9. The bottom line — significance in one breath

- **Faster:** stop at the first thing that's wrong, instead of studying the whole system.
- **Safer:** investigation can't change anything; humans approve every fix; everything is recorded.
- **Self-improving:** every fix leaves behind reusable knowledge, so the system gets smarter and repeated problems triage themselves.
- **Less fragile:** knowledge moves out of a few experts' heads into a shared, portable asset.
- **Cheaper over time:** no big documentation project; the map draws itself as you go, and it's always current because it's built from real fixes.

---

## 10. What it is — and what it isn't

**It is:** a disciplined, repeatable method for diagnosing problems in a complex system that lacks documentation, run with AI assistance and human oversight, that captures reusable knowledge as a byproduct of every fix.

**It isn't:** magic, and it isn't an AI that fixes things on its own. It doesn't replace your experts — it *amplifies* them, doing the tedious tracing and record-keeping so people can focus on judgment. It doesn't bypass review; humans stay in control of every change.

---

## Glossary (plain language)

- **The Ledger** — the official source of truth where the real data lives (technically: an Oracle database).
- **The Catalog** — the fast, searchable copy the app actually reads (technically: Elasticsearch).
- **The Front Desk** — the service that answers users' questions, reading from the Catalog (technically: a web API).
- **The Couriers** — the system that carries live changes from the Ledger to the Catalog (technically: change-data-capture via GoldenGate and Kafka).
- **The Descent** — the step-by-step diagnosis that goes from symptom to cause, stopping at the first thing that's wrong.
- **The Shrink** — removing search conditions one at a time until results reappear, to find the field that was killing them.
- **The Trace** — following a data change hop by hop, like tracking a parcel, to find where it got stuck.
- **Stale data** — the official record changed, but the copy the user sees hasn't caught up yet.
- **Lineage** — the documented path of where a value comes from: which app field maps to which copy field maps to which source column.
