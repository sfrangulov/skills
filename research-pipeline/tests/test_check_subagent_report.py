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


def _run(text, capsys):
    import io
    sys.stdin = io.StringIO(text)
    try:
        rc = csr.main([])
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
