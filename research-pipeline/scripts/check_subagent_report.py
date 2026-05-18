"""Stage 1-2 guard: validate a subagent's returned report envelope.

The lead pipes every returned subagent report through this. Catches the
orchestration failure modes the parent transcript cannot otherwise see
(subagent dispatched via the Agent tool returns only a narrated result):

  - empty / truncated return (subagent crashed or produced nothing)
  - no Sources section (OUTPUT SCHEMA not followed)
  - opened:false source with no disposition (carried as a half-result
    instead of escalated/dropped per the fetch-contract)
  - missing mandatory Counter-claim candidate

Line: SUBAGENT[report]: <reason> [hint]
Exit: 0 clean | 1 violations (re-dispatch once, then fail loud) | 2 usage.
"""
from __future__ import annotations
import argparse, re, sys

_MIN_CHARS = 200
_URL = re.compile(r"https?://", re.IGNORECASE)
_OPENED = re.compile(r"opened\s*[:=]", re.IGNORECASE)
_OPENED_FALSE = re.compile(r"opened\s*[:=]\s*false", re.IGNORECASE)
_DISPOSITION = re.compile(
    r"disposition|escalat|эскал|dropped|\bdrop(?:ped)?\b|выкин|снят|"
    r"weakened|tagged|\bgap", re.IGNORECASE)
_COUNTER = re.compile(
    r"counter-?\s*claim|контр-?претенз|контраргумент|"
    r"counter-?\s*evidence\s+candidate", re.IGNORECASE)

# v1.6 (s-zeb): the Agent tool hides the subagent's tool calls. The
# subagent declares a per-source fetch_tier; this verifies the process
# without seeing the calls. Barred for a *verbatim* quote (paraphrase
# tiers): WebFetch (small-model summary) and WebSearch (discovery only).
_OBJ = re.compile(r"\{[^{}]*\}")
_URL_IN = re.compile(r"\burl\s*[:=]\s*[\"']?([^\s,\"'}]+)", re.IGNORECASE)
_SRCURL_IN = re.compile(r"\bsource_url\s*[:=]\s*[\"']?([^\s,\"'}]+)",
                        re.IGNORECASE)
_TIER_IN = re.compile(r"fetch[_-]?tier\s*[:=]\s*[\"']?(\w+)", re.IGNORECASE)
_VQ_IN = re.compile(r"verbatim_quote\s*[:=]\s*[\"']([^\"']*)[\"']",
                    re.IGNORECASE)
_BARRED_VERBATIM = {"webfetch", "websearch"}
_MANIFEST_BLOCK = re.compile(r"```provenance-manifest\n(.*?)\n```", re.DOTALL)


def _norm_tier(t: str) -> str:
    return re.split(r"[^a-z0-9]", t.strip().lower(), maxsplit=1)[0]


def _declared_tiers(body: str) -> dict[str, str]:
    """url -> declared fetch_tier, from Source objects that carry one."""
    out: dict[str, str] = {}
    for obj in _OBJ.findall(body):
        u, t = _URL_IN.search(obj), _TIER_IN.search(obj)
        if u and t:
            out[u.group(1)] = _norm_tier(t.group(1))
    return out


def _verbatim_source_urls(body: str) -> set[str]:
    """source_urls of Findings carrying a non-empty verbatim_quote."""
    out: set[str] = set()
    for obj in _OBJ.findall(body):
        su, vq = _SRCURL_IN.search(obj), _VQ_IN.search(obj)
        if su and vq and vq.group(1).strip():
            out.add(su.group(1))
    return out


def _manifest_tools(path: str) -> dict[str, str]:
    """url -> tool from a manifest TSV or a doc's provenance-manifest block."""
    text = open(path, encoding="utf-8").read()
    m = _MANIFEST_BLOCK.search(text)
    body = m.group(1) if m else text
    out: dict[str, str] = {}
    for ln in body.splitlines():
        if not ln.strip():
            continue
        parts = ln.split("\t")
        if len(parts) >= 5:
            out[parts[1]] = _norm_tier(parts[4])
    return out


def fetch_tier_findings(body: str, manifest_path: str | None) -> list[str]:
    out: list[str] = []
    tiers = _declared_tiers(body)
    for url in sorted(_verbatim_source_urls(body)):
        t = tiers.get(url)
        if t in _BARRED_VERBATIM:
            out.append(f"SUBAGENT[report]: verbatim quote from a {t}-tier "
                       f"source {url} — {t} is barred as a verbatim tier "
                       f"(paraphrase, not page text) [escalate to "
                       f"defuddle/firecrawl or drop the quote]")
    if manifest_path:
        mt = _manifest_tools(manifest_path)
        for url, t in sorted(tiers.items()):
            if url in mt and mt[url] != t:
                out.append(f"SUBAGENT[report]: declared fetch_tier={t} for "
                           f"{url} but manifest tool={mt[url]} — process "
                           f"unverifiable, tiers disagree [reconcile the "
                           f"report with the snapshot manifest]")
    return out


def check_report(text: str, manifest_path: str | None = None) -> list[str]:
    out: list[str] = []
    body = text.strip()
    if len(body) < _MIN_CHARS:
        return [f"SUBAGENT[report]: empty-or-too-short ({len(body)}<"
                f"{_MIN_CHARS} chars) [subagent returned nothing usable; "
                f"re-dispatch once, then fail loud]"]
    if not (_URL.search(body) and _OPENED.search(body)):
        out.append("SUBAGENT[report]: missing-sources [OUTPUT SCHEMA requires "
                    "Sources:[{url,source_class,opened}]]")
    for m in _OPENED_FALSE.finditer(body):
        win = body[max(0, m.start() - 200): m.end() + 200]
        if not _DISPOSITION.search(win):
            out.append("SUBAGENT[report]: opened:false source with no "
                       "disposition [escalate the fetch tier, drop it, or "
                       "tag it weakened — never carry it as a half-result]")
            break
    if not _COUNTER.search(body):
        out.append("SUBAGENT[report]: missing Counter-claim candidate "
                    "[spec: mandatory even when none was found]")
    out += fetch_tier_findings(body, manifest_path)
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Validate a subagent report.")
    p.add_argument("--report", help="file with the report (default: stdin)")
    p.add_argument("--manifest", help="manifest TSV / doc with a "
                   "provenance-manifest block: cross-check declared "
                   "fetch_tier against the recorded tool")
    a = p.parse_args(argv)
    try:
        text = (open(a.report, encoding="utf-8").read() if a.report
                else sys.stdin.read())
    except OSError as e:
        print(f"usage: cannot read report: {e}", file=sys.stderr)
        return 2
    try:
        findings = check_report(text, a.manifest)
    except OSError as e:
        print(f"usage: cannot read manifest: {e}", file=sys.stderr)
        return 2
    for f in findings:
        print(f)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
