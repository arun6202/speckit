#!/usr/bin/env bash
# OPTIONAL PreToolUse/SessionStart hook (STUB). Encourage one ticket per session.
# Idea: require a JIRA-ID in the branch name or an env var TICKET_ID before probes run,
# so evidence always lands in tickets/<JIRA-ID>/. Implement to taste.
: "${TICKET_ID:?Set TICKET_ID=JIRA-#### for this session (stub guard — remove if unwanted)}"
exit 0
