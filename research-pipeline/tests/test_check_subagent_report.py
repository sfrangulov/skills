import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))
import check_subagent_report as csr


# Fixtures distilled from real log 66df643e (skills-test session).

_EMPTY = ""                                    # AGENT #2/#3/#4 RESULT(len=0)

_OPENED_FALSE_NO_DISP = """\
## SABIS official-source report
Sources:
[ {url: https://www.sabis.net/about-sabis, source_class: official, opened: true},
  {url: https://www.sabis.net/the-world-of-sabis/the-sabis-educational-system, source_class: official, opened: false} ]
Findings: [{claim: "...", source_url: "https://www.sabis.net/about-sabis", verbatim_quote: "...", locator: "Our Philosophy"}]
Counter-claim candidate: SABIS self-reports exam results; no independent audit cited.
"""  # opened:false carried with NO disposition (defuddle returned empty/JS-shell)

_VALID = """\
## SABIS official-source report
Sources:
[ {url: https://www.sabis.net/about-sabis, source_class: official, opened: true},
  {url: https://www.sabis.net/edu-system, source_class: official, opened: false, disposition: dropped} ]
Findings: [{claim: "SABIS operates in 6 emirates", source_url: "https://www.sabis.net/about-sabis", verbatim_quote: "in 6 of the emirates", locator: "Network"}]
Deep-read notes: the about page enumerates the emirates verbatim.
Gaps: no per-campus enrolment numbers.
Counter-claim candidate: figures are self-published, not independently audited.
"""

_NO_SOURCES = """\
## Report
I looked into SABIS and it seems like a large network with many schools
across several countries. The model emphasises a point system and frequent
testing, and reviewers tend to mention exam focus and teacher turnover.
Overall the picture is of an exam-oriented chain with mixed parent
sentiment, but I did not open or quote any specific page for this.
Counter-claim candidate: some parents report strong STEM outcomes.
"""


# v1.6 (s-zeb): the Agent tool hides the subagent's tool calls from the
# parent. The subagent must declare a machine-readable per-source
# fetch_tier; the checker (a) flags a verbatim quote drawn from a
# WebFetch/WebSearch tier (barred verbatim tiers) and (b) cross-checks the
# declared tier against the snapshot manifest's tool field.

# Real failure mode from log 66df643e: a verbatim quote whose actual fetch
# was WebFetch (a small-model paraphrase presented as verbatim).
_VERBATIM_FROM_WEBFETCH = """\
## SABIS official-source report
Sources:
[ {url: https://www.sabis.net/about-sabis, source_class: official, opened: true, fetch_tier: webfetch} ]
Findings: [{claim: "SABIS operates in 6 emirates", source_url: "https://www.sabis.net/about-sabis", verbatim_quote: "in 6 of the emirates", locator: "Network"}]
Deep-read notes: about page enumerates emirates.
Gaps: none.
Counter-claim candidate: figures are self-published.
"""

_VALID_WITH_TIER = """\
## SABIS official-source report
Sources:
[ {url: https://www.sabis.net/about-sabis, source_class: official, opened: true, fetch_tier: defuddle},
  {url: https://www.sabis.net/edu-system, source_class: official, opened: false, disposition: dropped} ]
Findings: [{claim: "SABIS operates in 6 emirates", source_url: "https://www.sabis.net/about-sabis", verbatim_quote: "in 6 of the emirates", locator: "Network"}]
Deep-read notes: the about page enumerates the emirates verbatim.
Gaps: none.
Counter-claim candidate: figures are self-published, not independently audited.
"""

_MANIFEST_WEBFETCH = (
    "c1\thttps://www.sabis.net/about-sabis\t" + "a" * 64 +
    "\t2026-05-18T00:00:00+00:00\twebfetch\tNetwork\n")
_MANIFEST_DEFUDDLE = (
    "c1\thttps://www.sabis.net/about-sabis\t" + "a" * 64 +
    "\t2026-05-18T00:00:00+00:00\tdefuddle\tNetwork\n")


def _run(text, capsys, argv=None):
    import io
    sys.stdin = io.StringIO(text)
    try:
        rc = csr.main(argv or [])
    finally:
        sys.stdin = sys.__stdin__
    return rc, capsys.readouterr().out


def test_empty_report_flagged(capsys):
    rc, out = _run(_EMPTY, capsys)
    assert rc == 1
    assert "SUBAGENT[report]" in out and "empty" in out


def test_opened_false_without_disposition_flagged(capsys):
    rc, out = _run(_OPENED_FALSE_NO_DISP, capsys)
    assert rc == 1
    assert "SUBAGENT[report]" in out
    assert "opened" in out and "disposition" in out


def test_missing_sources_flagged(capsys):
    rc, out = _run(_NO_SOURCES, capsys)
    assert rc == 1
    assert "SUBAGENT[report]" in out and "sources" in out.lower()


def test_valid_report_passes(capsys):
    rc, out = _run(_VALID, capsys)
    assert rc == 0
    assert "SUBAGENT[report]" not in out


# --- v1.6: process provenance (per-source fetch-tier) --------------------

def test_verbatim_quote_from_webfetch_tier_flagged(capsys):
    """A verbatim quote whose declared fetch_tier is WebFetch — barred as
    a verbatim tier (it is a small-model paraphrase)."""
    rc, out = _run(_VERBATIM_FROM_WEBFETCH, capsys)
    assert rc == 1
    assert "SUBAGENT[report]" in out
    assert "fetch" in out.lower() and "verbatim" in out.lower()


def test_valid_report_with_declared_tier_passes(capsys):
    rc, out = _run(_VALID_WITH_TIER, capsys)
    assert rc == 0
    assert "SUBAGENT[report]" not in out


def test_pre_tier_valid_report_still_passes(capsys):
    """Backward compat: a report with no fetch_tier and no manifest cannot
    prove a violation -> must still pass (FP≈0)."""
    rc, out = _run(_VALID, capsys)
    assert rc == 0


def test_declared_tier_mismatches_manifest_tool_flagged(tmp_path, capsys):
    """Declared fetch_tier=defuddle but the manifest (ground truth, written
    by snapshot_manifest.py) records tool=webfetch for that URL."""
    man = tmp_path / "m.tsv"
    man.write_text(_MANIFEST_WEBFETCH, encoding="utf-8")
    rc, out = _run(_VALID_WITH_TIER, capsys, ["--manifest", str(man)])
    assert rc == 1
    assert "SUBAGENT[report]" in out
    assert "manifest" in out.lower() and "webfetch" in out.lower()


def test_declared_tier_matches_manifest_tool_passes(tmp_path, capsys):
    man = tmp_path / "m.tsv"
    man.write_text(_MANIFEST_DEFUDDLE, encoding="utf-8")
    rc, out = _run(_VALID_WITH_TIER, capsys, ["--manifest", str(man)])
    assert rc == 0
    assert "SUBAGENT[report]" not in out
