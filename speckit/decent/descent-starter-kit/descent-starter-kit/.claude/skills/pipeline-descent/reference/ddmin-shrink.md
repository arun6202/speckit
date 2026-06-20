# Reference — ddmin / shrinking the query

The empty query is a **failing counterexample**. Reduce its predicate set to a **1-minimal** subset that
still returns zero hits — the culprit. This is Zeller & Hildebrandt's `ddmin` (delta debugging) and is
conceptually identical to FsCheck **shrinking** a failing input to its minimal reproducer.

## Algorithm (vs the manual "peel to ID, add back one at a time")
- Manual is linear: O(n) probes. `ddmin` is divide-and-conquer: partition into n chunks (start n=2),
  test subsets and complements, recurse into whichever still fails, doubling granularity, finishing with a
  one-by-one deletion pass to GUARANTEE 1-minimality. Binary-search fast in the common case.

## Mapping to an ES bool query
- Each predicate (field/value clause) is a "delta".
- The oracle is three-valued: `Found | NotFound | Unresolved` (keep `Unresolved` so a flaky probe never
  gets mistaken for a real result).
- After convergence, classify the culprit via `../reference/es-zero-hit-ladder.md`.

Implementation: `fsx/Descent.Shrink.fsx` (`ddmin`).
