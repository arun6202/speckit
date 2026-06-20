#!/usr/bin/env bash
# PreToolUse hook — deny any write-shaped probe in ANY environment (prod & non-prod).
# Wire it in .claude/settings.json (PreToolUse). Exit 2 = deny the tool call.
# Claude Code passes the tool call as JSON on stdin: {"tool_name": "...", "tool_input": {...}}.
# This is a STARTER guard — tune the patterns to your tools (Bash, and any custom MCP probe tools).

set -euo pipefail
payload="$(cat)"
text="$(printf '%s' "$payload" | tr '[:upper:]' '[:lower:]')"

# Elasticsearch write verbs / endpoints, Oracle DML/DDL, Kafka offset mutation.
deny_re='(_bulk|_update_by_query|_delete_by_query|/_doc|/_create|/_update|reindex|put +/|post +/[a-z0-9_.*-]+/_doc|delete +/|"method" *: *"(put|post|delete)")'
deny_sql='( insert +into | update +[a-z0-9_."]+ +set | delete +from | merge +into | truncate +table | drop +| alter +| create +| commit| grant )'
deny_kafka='(--reset-offsets|kafka-consumer-groups.*--execute|--to-earliest|--to-latest|commitsync|--delete)'

if printf '%s' "$text" | grep -Eq "$deny_re" \
   || printf '%s' "$text" | grep -Eq "$deny_sql" \
   || printf '%s' "$text" | grep -Eq "$deny_kafka"; then
  echo "DENIED by block-writes.sh: probes are read-only in all environments. Route writes through plan -> approval -> reviewed script." >&2
  exit 2
fi
exit 0
