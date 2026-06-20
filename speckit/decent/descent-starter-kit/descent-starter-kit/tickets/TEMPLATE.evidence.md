# <JIRA-ID> — evidence pack

Copy this to `tickets/<JIRA-ID>/NOTES.md`. Append as you descend; one ticket per session.

## 1. Scope (rung 1)
- Env: prod / nonprod(<slot>)
- Endpoint / operationId / module:
- Business key:
- Reporter request:
- Actual / Expected:
- Severity · Reproducible (y/n):

## 2. Reproduce (rung 2)
- Replay result (hit count):
- Valid against OpenAPI? :
- If zero hits -> SHRINK:
  - full set result:
  - ddmin 1-minimal culprit predicate(s):
  - classification (analyzer/case/should-flip/nested/mapping):
  - evidence (_analyze tokens / _validate rewrite / _explain):

## 3. Lineage (rung 3)
| API field | ES field | F# fn | Oracle table.column | Rule | Freshness | Confidence |
|---|---|---|---|---|---|---|
- Known-good EsId:
- ⚠️ C# files read:

## 4. System of record (rung 4)
- Oracle SQL + result:
- Correct? (y -> descend / n -> SorDataIssue, escalate)

## 5. Batch reconcile (rung 5)
- Transform output vs target diff:

## 6. Realtime trace (rung 6)
- Hop trail (op_ts/pos/csn): Oracle -> Kafka(p/offset) -> temp -> target
- Stopped at:
- Consumer lag:

## 7. Verdict
- RootCause:
- Why alternatives rejected:

## 8. Residue (required)
- Regression property (FsCheck/Expecto):
- Lineage row appended to docs/ai/lineage-map.seed.md? :
- CLAUDE.md / rule note added? :

## 9. Fix (separate from investigation)
- Plan / approver / reviewed script / backfill / rollback:
