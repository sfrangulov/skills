# Verification funnel (Stage 5)

Doctrine: **deterministic first, FP≈0, ~free; LLM-judge only where determinism
cannot decide; the expensive tool is the narrowest.** Run by an independent
verifier sub-agent — not the synthesizer checking itself.

## Deterministic gates (no LLM), in order

Applied to **every** cited claim:

- **A. URL resolves** — HTTP 200, not a soft-404.
- **B. Domain in allowlist** — source-class consistent with Stage 3.
- **C. Quote is a verbatim substring** of the snapshot body, after
  normalization (NFKC, whitespace, smart-quotes, de-hyphenation).
- **D. Key claim tokens co-occur** within a ±1500-char window of the quote.

Disposition: `FAIL` = hard (claim cannot canonize), `FLAG` = advisory
(goes to judge), `OK`. A quote-as-quote or a bare number/date that passes
A–D is dispositive — **no judge needed**.

Honest false-positives (mitigate, do not ignore): paywall / JS-SPA / PDF /
dynamic / moved anchor / lightly-edited quote. Mitigation: escalate the
fetch tier *before* a quote-not-found verdict; fuzzy ≥90% tokens → `FLAG
paraphrased`; cache the page at synthesis time; PDF content-type branch.
Boundary: a substring proves "this string is on the page", not "the page
asserts this" (negation / out-of-context) — that residue is for the judge.

## LLM-judge — only the FLAG remainder

Only paraphrase / cross-source residue reaches the judge. Use a **different
(cheaper) model than the synthesizer**. Discrete scale, pass/fail, N-runs +
threshold. RAGAS-Faithfulness = supported/total; ALCE citation
precision/recall via NLI-entailment. Caveat: ALCE misses partial-support,
human κ≈0.525 — do not trust the judge above the inter-human baseline.

## Verifier sub-agent

Independent (not self), adversarial prompt, cheaper model. Runs deterministic
gates → judge only on FLAG. Emits machine-readable, one line per claim:

```
VERIFY[<id>]: ok | unsupported | url-dead | paywalled | inconclusive [tier= cost=]
```

The lead acts **only on the verdict** — it does not re-interpret the claim.
Cost control: 100% of load-bearing claims; 10–20% sample tripwire on the
rest; cache verdicts by `sha256(url)` (retry is not double-billed).

**Coverage honesty (provenance line).** Report verbatim coverage as
`N/<total cited>` against the count of distinct `[^h:]` snapshots the
document cites — never `N/N` framed as complete. If the rest is sampled,
say so explicitly (`K of M sampled`). A bare "10/10 PASS" while 22 claims
are cited is incomplete-verification-as-complete (failure-class 5);
`check_research_snapshots.py` now flags it as a `COVERAGE` finding.

Pattern reuse: ARS (Imbad0202) claim-audit — deterministic-dispatch-first,
single judge per flagged citation, different judge_model, calibration gold
set with FNR/FPR gates.
