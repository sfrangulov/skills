# Subagent task-spec (Stage 1–2)

A subagent without a structured spec duplicates work and leaves gaps. Give
every research subagent this exact shape — prose is not enough.

## Template

```
ROLE: <e.g. official-documentation researcher>
OBJECTIVE: <one sentence; the question this subagent alone owns>
SOURCE ALLOWLIST: <domains/source-classes it may use; official/primary first>
TOOL ALLOWLIST: <e.g. WebSearch for discovery; defuddle/firecrawl for reading>
OUTPUT SCHEMA (return exactly this):
  - Sources: [{url, source_class: official|authoritative|general, opened: true|false,
      disposition: <required iff opened:false: escalated|dropped|weakened>}]
  - Findings: [{claim, source_url, verbatim_quote, locator}]
  - Deep-read notes: <what the opened sources actually say, in your words>
  - Gaps: <what you could not establish>
  - Counter-claim candidate: <the strongest thing that would contradict your findings>
BOUNDARIES: <what is explicitly out of scope for this subagent>
DEPTH: <DEEP = open and read sources verbatim | SCAN = triage only>
```

## Rules

- **Lead decides DEPTH and tier**, never the subagent ("agents struggle to
  judge appropriate effort").
- **`Counter-claim candidate` is mandatory**, even when the subagent found
  none — forcing it surfaces weak consensus early and feeds Stage 6.
- **`opened` must be honest.** A source seen only as a search snippet is
  `opened: false`; its claims cannot canonize without going through the
  fetch-contract (Stage 4) or being tagged `weakened` (Stage 6).
- 3–5 subagents in parallel; dependent ones serial. Subagents do not spawn
  subagents — you (the lead, main thread) are the only orchestrator.
- **Validate every returned report** (the Agent tool returns only a narrated
  result — an empty or non-conforming return is otherwise invisible):
  `python3 scripts/check_subagent_report.py < report`. Non-zero → re-dispatch
  that subagent once, then fail loud. Never synthesize from an unvalidated
  return.
- The lead reads distilled notes, not raw search dumps (context hygiene).
- The lead never invents a URL; URLs come only from subagent `Sources`.

Pattern reuse: daymade/claude-code-skills `deep-research` subagent contract.
