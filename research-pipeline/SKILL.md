---
name: research-pipeline
description: Disciplined multi-source research pipeline that produces a verifiable, citation-backed report — orchestrated subagents, source-discipline, content-addressed snapshots, a deterministic→judge verification funnel, and a mandatory adversarial fact-check pass. Use when a deep-research document (best-practices canon, technology evaluation, claims that downstream code or decisions will lean on) must be source-grounded, fact-checked, and reproducible across sessions or machines — not a quick lookup. Explicit-invocation only.
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
- [ ] -1. Reconnaissance: -1a scope (≤3 Qs, gap-driven) + -1b source-triage → recon-manifest
- [ ] 0. Justify the fan-out (effort tier; ~15x token cost vs single agent)
- [ ] 1. Lead plans: effort tier + per-subagent structured spec
- [ ] 2. Dispatch up to 20 subagents, tier-driven (parallel; dependent ones serial)
- [ ] 3. Source-discipline: official/primary > authoritative-secondary > general
- [ ] 4. Fetch-contract on every cited source (snapshot + manifest line)
- [ ] 5. Verification funnel: deterministic gates -> judge on the flagged remainder
- [ ] 6. Adversarial pass: refute load-bearing claims; epistemic-tag each
- [ ] 7. Canonize: 7a verify working form (manifest + [^h:sha]) → 7b emit canonical form (frontmatter + [^slug] + ## Источники + collapsed provenance-callout)
```

**Stage -1 — Reconnaissance.** Before sizing effort, the lead scopes and triages. **-1a (gap-driven, ≤3 questions):** reconcile the request against objective · scope · freshness horizon · project-payload; ask only what is missing, or 0 questions if already specified or the user is unavailable (record derived assumptions explicitly). **-1b (autonomous):** triage the source landscape and emit a ` ```recon-manifest ` block (one TSV line per source: `material`, `url`, `source_class`, `freshness`, `why`, `verdict_slot`). See [references/recon-protocol.md](references/recon-protocol.md). This is what re-introduces freshness and personalization as *contracted* inputs, honestly tagged, without weakening the verbatim canon.

**Stage 0 — Justify.** Effort tier decided here, by you (not the subagent), from the Stage -1 recon output: fact = 1–3 agents (3–10 calls); comparison = 3–8; complex = up to 20 — no minimum, as many distinct angles as the question genuinely has, don't pad to hit a number. If the value does not justify ~15× tokens, stop and answer directly. **Re-synthesis over an existing cache** (re-scope, translate) is legitimate and proportionate — but for each *load-bearing* claim it must open the deepest cached source for that fact (the regulator report, not just the summary page) and re-run the adversarial pass as a dispatched sub-agent, not a quick inline self-check. An inline re-attack silently coarsens load-bearing findings. When you declare re-synthesis, record the dispatched pass machine-readably — a line `adversary-dispatch: subagent=<id> report=<sha8> verdict=<survived|weakened|refuted>`. The v1.5 gate flags a doc that declares re-synthesis but carries no such record (prose like "claims were attacked" is exactly the inline coarsening); inert without the declaration → FP≈0.

**Stage 1–2 — Orchestrate.** You are the lead and the main thread (subagents cannot spawn subagents). Give each subagent a structured task spec — see [references/subagent-spec.md](references/subagent-spec.md). Do not delegate effort sizing. Validate every returned report with `python3 scripts/check_subagent_report.py` (pass `--manifest <doc>` to also cross-check each declared `fetch_tier` against the snapshot manifest's tool) before synthesis — an empty or non-conforming Agent-tool return is otherwise silent; re-dispatch once, then fail loud.

**Stage 3 — Source-discipline.** official/primary > authoritative-secondary > general. You never invent a URL; URLs come only from subagent notes.

**Stage 4 — Fetch-contract.** Every source backing a canonized claim passes the fetch-escalation tiers and is snapshotted. This is the stage ambient habits skip. See [references/fetch-contract.md](references/fetch-contract.md). Record each with the bundled tool:

```bash
python3 scripts/snapshot_manifest.py --claim-tag c1 --url "<url>" \
  --tool defuddle --locator "<section>" \
  --cache-dir ~/.cache/agent-research/snapshots < extracted_body.md
```

It prints the manifest TSV line. Collect every line for Stage 7. (Use
`python3`; the bundled scripts are not invoked via a bare `python`.)

**Stage 5 — Verification funnel.** Deterministic gates A–D first — **A** URL-resolves, **B** allowlist, **C** verbatim-substring, **D** key-token co-occurrence within a **±1500-char window** — disposition `FAIL` (hard) / `FLAG` (→ judge) / `OK`; LLM-judge (a different, cheaper model) only on the `FLAG` remainder, run by an independent verifier that emits one machine line per claim: `VERIFY[<id>]: ok | unsupported | url-dead | paywalled | inconclusive [tier= cost=]`. The lead acts **only on the verdict**. See [references/verification-funnel.md](references/verification-funnel.md).

**Stage 6 — Adversarial pass.** A separate sub-agent whose mandate is to *refute* each load-bearing claim. See [references/adversarial-protocol.md](references/adversarial-protocol.md). Output per claim: `survived | weakened | refuted` + epistemic-status tag `[class, verified?, verdict]`. The v1.8 backstop fails `COVERAGE` if a `refuted` claim is canonized normally or an epistemic tag's verdict is malformed. For every recon-manifest source tagged `freshness=stale?`, the adversary must check whether a newer official version supersedes the claim and, if so, tag it `weakened [superseded-by <version>]` rather than a silently stale `survived`.

**Stage 7 — Canonize (verify-then-emit).** Only `survived`/`weakened` claims enter the document. `refuted` → drop, or reframe as an explicit open contradiction (never silently average).

*7a — Working form (for verification).* Assemble the doc with a fenced ` ```provenance-manifest ` block of the collected TSV lines; each canonized claim footnotes `[^h:<sha8>]`, not a bare URL. The provenance summary reports verbatim coverage as `N/<total cited>` (or an explicit `K of M sampled`) — never `N/N` passed off as complete. `claim_tag` is unique per snapshot; every manifest line is cited. Verify this working form with the snapshot/coverage gates below — they parse `[^h:<sha8>]` and the bare manifest, so run them BEFORE 7b.

*7b — Canonical emit (the final document form).* Once the gates pass, convert to the canonical form before delivering — see [references/canonical-format.md](references/canonical-format.md). In short: lift structured provenance into YAML frontmatter (`type/title/created/updated/status/method/beads/source_urls/tags`); relabel each `[^h:<sha8>]` → a stable `[^slug]`; add a `## Источники` section with `[^slug]: [label](url) — locator.` defs resolved from the manifest; move the method-narrative + the `provenance-manifest` TSV into a collapsed `> [!note]- Provenance & source manifest — <method> (machine audit)` callout at the very end. This keeps machine-audit out of the reading flow and fixes the broken-`[^h:sha]`-ref class. Transform is **lossless on prose** (body char-identical minus footnote markers). Verify (on the 7a working form):

```bash
python3 scripts/check_research_snapshots.py --doc <doc.md> \
  --cache-dir ~/.cache/agent-research/snapshots
```

Exit 0 = clean. `DRIFT` lines are advisory (sources legitimately change).
`COVERAGE` lines are not — they catch incomplete-verification-as-complete
(failure-class 5: overstated verbatim coverage, uncited manifest snapshot,
duplicate `claim_tag`, or a thin snapshot cited while a heavier capture of
the same URL sits uncited in the cache, or a recon-manifest `material=yes`
source with no `snapshotted:<sha>`/`gap:weakened`/`gap:dropped` verdict)
and are author defects to fix, not
accept. The
manifest stores a bare `sha256`; the snapshot file on disk is `<sha256>.md`
— do not hand-check the bare sha as a path, let the checker resolve it.

## Enforcement (v1.4) — the gates run without you remembering

The gates above are deterministic, but a gate you must remember to run is
prose, not enforcement (the exact failure class v1.1 fixed for coverage).
`scripts/check_all.py` is the single entrypoint: it **discovers** every doc
carrying a `provenance-manifest` block and every subagent report under a
root and runs both checkers on all of them — exit ≠ 0 if any artifact is
flagged. No per-doc invocation, no agent memory.

```bash
python3 scripts/check_all.py --docs-dir docs/research \
  --cache-dir ~/.cache/agent-research/snapshots [--reports-dir <dir>]
```

Wire it as a **Stop hook** so the harness — not you — runs it when the
session ends. In Claude Code `settings.json`:

```json
{ "hooks": { "Stop": [ { "hooks": [ { "type": "command",
  "command": "RESEARCH_DOCS_DIR=docs/research bash ~/.agents/skills/research-pipeline/hooks/research-gates-stop.sh" } ] } ] } }
```

A non-zero exit prints the flagged artifacts to stderr loudly. This is the
layer that makes the whole pipeline *enforced, not emergent* at the
orchestration boundary, not just within a doc you happened to check.

## Worked example (compressed)

Task: "best practices for X, official first then community."
Lead → tier=comparison, 3 subagents (official-docs / engineering-blogs / counter-evidence), each a structured spec. Subagents return notes with URLs. Fetch-contract: each cited page → defuddle (tier 1) → snapshot + manifest line. A community claim only found in a search snippet → source not opened → **does not canonize as a normal claim**; either open it through the fetch-contract or send it to the adversarial pass as `weakened [snippet-only, unopened]`. Funnel verifies quotes are verbatim substrings. Adversarial sub-agent counter-searches the load-bearing claims. Document ends with the provenance-manifest; checker exits 0.

## References

Read the one you need; all are one level deep from here:

- [references/recon-protocol.md](references/recon-protocol.md) — Stage -1 scoping checklist + source-triage + recon-manifest schema
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
- "Verbatim gate 10/10 PASS — clean headline." → 10/10 while 22 claims are cited is incomplete-verification-as-complete. Report `N/total cited` or disclose the sample. The checker now fails this as `COVERAGE`.
- "A subagent came back — good, synthesize." → The Agent tool returns only a narration; an empty or schema-less return is invisible until it corrupts the synthesis. Run `check_subagent_report.py` on every return first.
- "It's just a re-scope over cached snapshots, I'll re-attack the claims inline." → Inline re-attack is shallower than the dispatched adversary that first found the nuance; load-bearing findings coarsen silently. Open the deepest cached source and dispatch the adversary for load-bearing claims.
- "I'll just use whatever sources I already have." → Skipping Stage -1 lets freshness and personalization get optimized away silently. Run recon; a `material=yes` source that never reaches a snapshot must be tagged `gap:weakened`, not dropped.

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "Ambient rules already handle sources/honesty" | They handle 1/4/5, not reproducibility (3) or verbatim enforcement (2). That is exactly why this skill exists. |
| "Snapshotting every source is overhead" | The snapshot is one bundled command. The unreproducible doc is the real overhead — it fails silently, later. |
| "The snippet claim is low-stakes" | If it is low-stakes, dropping it costs nothing. If it is load-bearing, it must survive the funnel. Either way it does not get a free pass. |
| "Re-running the adversarial pass is expensive" | Confirmation bias from a single synthesizer is more expensive — it ships wrong claims that look complete. |
| "The checker is report-only so I can skip it" | Report-only means it does not block — not that you skip it. A clean exit 0 is the cheap proof the doc is reproducible. |
| "10/10 PASS reads cleaner than 10/22" | Clean ≠ honest. The denominator is the cited universe, not what you bothered to check. `COVERAGE` flags the gap; the cleaner number is the false one. |

## Known limitations (consciously accepted)

**Different-URL depth selection has no hard gate.** The case "you cited the
summary page of a *different* URL when a deeper report on the *same fact*
was reachable" (e.g. an `edarabia` KHDA-rating blurb cited where the
regulator's own inspection report would be the load-bearing source) is a
research *judgment*, not a string property. Deciding "same subject,
deeper source" honestly requires semantics; a pure-deterministic gate
would either need a hand-maintained regulator-domain map or fire on every
multi-page domain (high FP). Per the v1.1 lesson (s-ag3), a faked
deterministic gate or an unverifiable prose rule is worse than an honest
boundary — so this is **not** dressed up as a checker.

What *does* mechanically backstop it: the v1.3 thin-snapshot gate (same
URL, heavier capture uncited), the v1.5 re-synthesis gate (a declared
re-synthesis must record a dispatched adversary, who counter-searches for
the deeper source), and the mandatory Stage 6 adversarial pass for fresh
research. The residual — fresh research, different URL, no re-synthesis
declared — rests on Stage 0/Stage 6 discipline and the "snippet ≠ opened
source" Red Flag.

**Revisit trigger:** a *cheap discriminating* signal appears — e.g. a
small regulator-domain allowlist mapping a subject's summary-URL to its
report-URL — at which point this becomes an advisory `WARN` (FP tolerated,
never a hard gate). Until then: accepted, documented, not silently open.
