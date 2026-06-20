# Reference — the 6 reliability patterns, applied to the descent

Source idea: a generic "6 techniques to improve AI agents" reliability poster. Here is each pattern
instantiated for pipeline troubleshooting, so the agent is production-reliable, not just clever.

1. **Reflection loop** → rung 7. Generate verdict → critique vs evidence + an independent re-probe →
   the regression property must fail on the bug → revise until it passes.
2. **Plan & Execute** → the descent plan (rungs 1–6) chosen in plan mode; gates allow mid-flight replanning.
3. **Layered memory** → `docs/ai/memory-layers.md` (short-term scope / retrieved codebase / episodic cache),
   always paired with context pruning on each green gate.
4. **Tool design** → `fsx/` micro-tools: one purpose, typed in/out, `Result`/DU, `ProbeError` fallback,
   read-only by construction.
5. **Human in the loop** → writes/fixes are high-stakes steps gated by `prod-safety.md`; investigation is autonomous.
6. **Eval suite** → `evals/` hard-ticket set + per-ticket regression properties accreting in CI.

What the poster omits and this kit adds: **pruning** (forgetting ruled-out context) and a **typed stopping
rule** (convict at the first failing gate). Those two stop patterns 1+3+6 from compounding into a slow loop.
