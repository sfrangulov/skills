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


def check_report(text: str) -> list[str]:
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
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Validate a subagent report.")
    p.add_argument("--report", help="file with the report (default: stdin)")
    a = p.parse_args(argv)
    try:
        text = (open(a.report, encoding="utf-8").read() if a.report
                else sys.stdin.read())
    except OSError as e:
        print(f"usage: cannot read report: {e}", file=sys.stderr)
        return 2
    findings = check_report(text)
    for f in findings:
        print(f)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
