# Rung 7 — Verdict reflection (Generate → Critique → Revise)

**Goal:** don't accept the first plausible cause. Falsify it before you commit.

Before finalising a `RootCause`, run one reflection loop:

1. **Critique the cause.** Does the evidence support EXACTLY this cause, and does it RULE OUT the other
   members of the closed `RootCause` set? If two causes still fit, you stopped too early — gather the one
   probe that separates them.
2. **Critique with an independent signal** (not self-judgement): re-run the failing query, re-read Oracle,
   or re-trace the hop. The critic must use a different signal than the one that produced the verdict.
3. **The property test is the unit test.** Write the regression property and confirm it (a) FAILS on the
   current defect and (b) would PASS after the proposed fix. If it can't be made to fail on the bug, you
   don't understand the bug yet — revise.
4. Repeat until it passes. Then the verdict is accepted and residue is emitted.

**Gate:** cause uniquely supported + alternatives excluded + property test fails-on-bug → **accept**.
Otherwise → revise (back to the relevant rung).

> Reflection is cheap insurance on rungs 3–6 (pipeline causes). For a mechanically-proven rung-1/2
> consumer-side conviction, a single critique pass is enough — don't loop for its own sake.
