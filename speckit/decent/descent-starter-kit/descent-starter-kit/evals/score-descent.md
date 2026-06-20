# Scoring a descent run

For each eval case, capture and compare:

| Signal | Pass criterion | Why |
|---|---|---|
| `root_cause` | == `expected_root_cause` | did it reach the right closed-set cause |
| `culprit` (field/hop) | matches `expected_culprit` | did it localise, not just classify |
| `rung_stop` | == `expected_rung_stop` | did it **stop early** (no over-descending) |
| shrink probes | <= small bound (e.g. <= ceil(log2 n)+n) | shrink converged efficiently, didn't brute-force |
| writes attempted | **0** always | read-only invariant held |
| residue | a property test that fails-on-bug exists | reflection closed the loop |

Headline score = fraction of cases with correct cause AND correct culprit AND zero writes.
Track separately: early-stop rate and average shrink probes (efficiency, not just correctness).

> A run that gets the right cause by descending all six rungs every time is FAILING the stopping rule,
> even at 100% cause-accuracy. Penalise over-descent.
