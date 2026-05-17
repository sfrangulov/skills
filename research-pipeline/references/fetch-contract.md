# Fetch-escalation contract (Stage 4)

This is the stage ambient habits skip. Every source backing a **canonized**
claim MUST pass these tiers and be snapshotted. A claim whose source never
reached a verbatim tier does not canonize as a normal claim.

## Tiers (escalate on the listed condition)

| Tier | Class | Escalate to next when |
|---|---|---|
| 0 | internal cache `sha256(url-body)` (snapshot of synthesis time) | miss / stale |
| 1 | clean-markdown, **defuddle-class**, verbatim | ≠200 · <250 chars · soft-404 · non-HTML · JS-shell |
| 2 | JS / anti-bot, **firecrawl-class** (stealth+proxy) | 403/429/captcha · empty after render |
| 3 | search-as-discovery (allowlist-only; same fact on primary/mirror) | no allowlisted alternative |
| 4 | web archive (Wayback `archive.org/wayback/available`) | no snapshot / ≠200 → FAIL url-dead (terminal) |

## WebFetch is NOT a verbatim tier

WebFetch returns a small-model paraphrase, not the page text. A quote taken
from WebFetch will fail the Stage 5 verbatim-substring gate by construction.
WebFetch is for summary/triage only — never as the source of a canonized
quote. (This is the partial failure observed in baseline: a claim entering
the doc from a summary instead of an opened source.)

## Mandatory recording

A successful fetch (tier 1–4) MUST, before the claim is usable:

1. write the extracted body to the content-addressed cache, and
2. append a manifest line.

Both are one command:

```bash
python3 scripts/snapshot_manifest.py --claim-tag <tag> --url "<url>" \
  --tool defuddle --locator "<section/anchor>" \
  --cache-dir ~/.cache/agent-research/snapshots < extracted_body.md
```

(Invoke via `python3` — the bundled scripts are not on a bare `python`.)

It prints the TSV line `claim_tag\turl\tsha256\tretrieved_at\ttool\tlocator`.
No manifest line → the claim is not canonizable (same gate as verification,
applied to external facts).

**Cache layout:** the manifest carries a bare `sha256`; the snapshot on disk
is `<cache-dir>/<sha256>.md`. When verifying by hand, append `.md` — or just
run `check_research_snapshots.py`, which resolves the path for you. Checking
the bare sha as a filename yields a false "unreproducible" signal.

The cache is machine-local and gitignored; the manifest (in the document) is
the canon. Cache-miss on a fresh machine → re-fetch by the recorded `tool`:
sha matches = claim alive; diverges = flag.
