---
name: research-pipeline
description: Use when conducting research whose claims must be source-grounded, independently verifiable, and reproducible across sessions or machines — not a quick lookup. Explicit-invocation only.
disable-model-invocation: true
---

# Research Pipeline

## Overview

**A research claim that cannot be reproduced from a frozen snapshot is not a finding — it is a memory of one.** This pipeline turns multi-source research into a verifiable artifact: every canonized claim points at a content-addressed snapshot, not a bare URL, and survives an adversarial pass before it enters the document.

Ambient habits (prefer official sources, counter-search, be honest) get you most of the way. They do not get you reproducibility or verbatim enforcement. This skill makes the upper layer **enforced, not emergent**.

## When to use

Use when the work product is a research document others (or future you, on another machine) must trust and re-check: best-practices canons, technology evaluations, claims that downstream code or decisions will lean on.

**Not for:** a quick factual lookup, reading one known doc, or anything where ~15× the tokens of a chat answer is not justified. This skill is explicit-only by design — if a single source answers it, you do not need the pipeline.

## The pipeline

Copy this checklist into your working notes and check off as you go:

```
Research Progress:
- [ ] 0. Justify the fan-out (effort tier; ~15x token cost vs single agent)
- [ ] 1. Lead plans: effort tier + per-subagent structured spec
- [ ] 2. Dispatch 3-5 subagents (parallel; dependent ones serial)
- [ ] 3. Source-discipline: official/primary > authoritative-secondary > general
- [ ] 4. Fetch-contract on every cited source (snapshot + manifest line)
- [ ] 5. Verification funnel: deterministic gates -> judge on the flagged remainder
- [ ] 6. Adversarial pass: refute load-bearing claims; epistemic-tag each
- [ ] 7. Canonize: only survived/weakened; emit provenance-manifest block
```

**Stage 0 — Justify.** Effort tier decided here, by you, not the subagent: fact = 1 agent / 3–10 calls; comparison = 2–4; complex = >10. If the value does not justify ~15× tokens, stop and answer directly.

**Stage 1–2 — Orchestrate.** You are the lead and the main thread (subagents cannot spawn subagents). Give each subagent a structured task spec — see [references/subagent-spec.md](references/subagent-spec.md). Do not delegate effort sizing.

**Stage 3 — Source-discipline.** official/primary > authoritative-secondary > general. You never invent a URL; URLs come only from subagent notes.

**Stage 4 — Fetch-contract.** Every source backing a canonized claim passes the fetch-escalation tiers and is snapshotted. This is the stage ambient habits skip. See [references/fetch-contract.md](references/fetch-contract.md). Record each with the bundled tool:

```bash
python3 scripts/snapshot_manifest.py --claim-tag c1 --url "<url>" \
  --tool defuddle --locator "<section>" \
  --cache-dir ~/.cache/agent-research/snapshots < extracted_body.md
```

It prints the manifest TSV line. Collect every line for Stage 7. (Use
`python3`; the bundled scripts are not invoked via a bare `python`.)

**Stage 5 — Verification funnel.** Deterministic gates first (URL resolves, allowlist, verbatim substring, token co-occurrence), LLM-judge only on the flagged remainder, run by an independent verifier. See [references/verification-funnel.md](references/verification-funnel.md).

**Stage 6 — Adversarial pass.** A separate sub-agent whose mandate is to *refute* each load-bearing claim. See [references/adversarial-protocol.md](references/adversarial-protocol.md). Output per claim: `survived | weakened | refuted` + epistemic tag.

**Stage 7 — Canonize.** Only `survived`/`weakened` claims enter the document. `refuted` → drop, or reframe as an explicit open contradiction (never silently average). End the document with a fenced ` ```provenance-manifest ` block of the collected TSV lines; each canonized claim footnotes `[^h:<sha8>]`, not a bare URL. Verify with:

```bash
python3 scripts/check_research_snapshots.py --doc <doc.md> \
  --cache-dir ~/.cache/agent-research/snapshots
```

Exit 0 = clean. Report-only; external sources legitimately change. The
manifest stores a bare `sha256`; the snapshot file on disk is `<sha256>.md`
— do not hand-check the bare sha as a path, let the checker resolve it.

## Worked example (compressed)

Task: "best practices for X, official first then community."
Lead → tier=comparison, 3 subagents (official-docs / engineering-blogs / counter-evidence), each a structured spec. Subagents return notes with URLs. Fetch-contract: each cited page → defuddle (tier 1) → snapshot + manifest line. A community claim only found in a search snippet → source not opened → **does not canonize as a normal claim**; either open it through the fetch-contract or send it to the adversarial pass as `weakened [snippet-only, unopened]`. Funnel verifies quotes are verbatim substrings. Adversarial sub-agent counter-searches the load-bearing claims. Document ends with the provenance-manifest; checker exits 0.

## References

Read the one you need; all are one level deep from here:

- [references/subagent-spec.md](references/subagent-spec.md) — Stage 1–2 structured task-spec template
- [references/fetch-contract.md](references/fetch-contract.md) — Stage 4 fetch-escalation tiers; WebFetch is barred as a verbatim tier
- [references/verification-funnel.md](references/verification-funnel.md) — Stage 5 deterministic gates → judge → verifier verdicts
- [references/adversarial-protocol.md](references/adversarial-protocol.md) — Stage 6 refute mandate + epistemic tagging

## Red Flags — STOP

These are the exact ways research silently degrades. If you catch yourself here, you are about to ship an unreproducible finding:

- "The source is obviously authoritative, I'll just cite the URL." → No snapshot = not reproducible. Run the fetch-contract.
- "This claim is only in the search snippet but it's clearly true." → Snippet ≠ opened source. It cannot canonize as a normal claim. Open it or tag it `weakened`.
- "WebFetch gave me a good summary, I'll quote that." → WebFetch paraphrases; the quote will fail the verbatim gate. WebFetch is not a verbatim tier.
- "I read it, I don't need to snapshot it." → Future-you on another machine has not read it. Snapshot or it didn't happen.
- "No counter-evidence turned up, so it's settled." → Absence of a counter-search ≠ absence of counter-evidence. The adversarial pass is mandatory, not conditional.
- "All sources agree, I'll merge them into one clean statement." → If they genuinely disagree elsewhere, averaging hides it. Contradiction is a first-class output.

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "Ambient rules already handle sources/honesty" | They handle 1/4/5, not reproducibility (3) or verbatim enforcement (2). That is exactly why this skill exists. |
| "Snapshotting every source is overhead" | The snapshot is one bundled command. The unreproducible doc is the real overhead — it fails silently, later. |
| "The snippet claim is low-stakes" | If it is low-stakes, dropping it costs nothing. If it is load-bearing, it must survive the funnel. Either way it does not get a free pass. |
| "Re-running the adversarial pass is expensive" | Confirmation bias from a single synthesizer is more expensive — it ships wrong claims that look complete. |
| "The checker is report-only so I can skip it" | Report-only means it does not block — not that you skip it. A clean exit 0 is the cheap proof the doc is reproducible. |
