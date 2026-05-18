#!/usr/bin/env bash
# v1.4 gate-enforcement Stop hook: the harness runs this when the agent
# stops — so the deterministic gates fire without the agent remembering.
# Wire it via Claude Code settings.json (see SKILL.md "Enforcement").
#
# Config via env (sane defaults; override per repo):
#   RESEARCH_DOCS_DIR    docs root to scan        (default: ./docs/research)
#   RESEARCH_CACHE_DIR   snapshot cache           (default: ~/.cache/agent-research/snapshots)
#   RESEARCH_REPORTS_DIR subagent-report dir      (optional; scanned if set)
#
# Exit 0 = all clean / nothing to scan. Exit 1 = a gate flagged an
# artifact (printed to stderr so it is loud, not swallowed).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docs="${RESEARCH_DOCS_DIR:-./docs/research}"
cache="${RESEARCH_CACHE_DIR:-$HOME/.cache/agent-research/snapshots}"

[ -d "$docs" ] || exit 0   # not a research repo / nothing to gate

args=(--docs-dir "$docs" --cache-dir "$cache")
[ -n "${RESEARCH_REPORTS_DIR:-}" ] && args+=(--reports-dir "$RESEARCH_REPORTS_DIR")

if ! out="$(python3 "$here/../scripts/check_all.py" "${args[@]}" 2>&1)"; then
  echo "research-pipeline gate FAILED — unreproducible/over-claimed artifact:" >&2
  echo "$out" >&2
  exit 1
fi
exit 0
