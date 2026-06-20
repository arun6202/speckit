# Rule: production safety

- **Read-only by default, everywhere.** Prod AND non-prod. No ES writes (index/update/delete/_update_by_query/
  reindex), no Oracle DML, no Kafka offset reset/commit. The `block-writes.sh` hook denies these; the F#
  `ReadOnly<'conn>` type makes them unrepresentable. Belt and braces.
- **Fixes are never applied inline by Claude.** The path is: investigate → minimal plan (files, tests, backfill,
  rollback) → human approval → reviewed script → dry run → execute with evidence captured.
- **Reindex / update-by-query / offset replay** require named human approval. Record who approved in the ticket.
- **Prod data in non-prod** for reproduction must be masked. Note the masking in the evidence pack.
- TODO (you decide): who approves each write class? Fill in the approver matrix here.
