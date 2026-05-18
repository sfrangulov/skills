"""v1.4 gate-enforcement: check_all.py is the autodiscovery orchestrator.

The defect class this closes: the deterministic gates (v1.1-v1.3) only run
if the agent remembers to invoke them, per-doc, by hand. check_all discovers
every research doc and every subagent report under a root and runs the
gates on all of them — no manual per-file invocation, no agent memory.
"""
import sys, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))
import snapshot_manifest as sm
import check_all as ca


def _doc(manifest_lines: list[str], body: str = "prose") -> str:
    m = "\n".join(manifest_lines)
    return f"# Doc\n\n{body}\n\n```provenance-manifest\n{m}\n```\n"


def test_autodiscovers_and_flags_defective_doc_among_clean(tmp_path, capsys):
    """RED: a defective doc buried beside clean ones is caught without the
    caller naming it — discovery is the mechanism, not agent memory."""
    cache = tmp_path / "cache"
    docs = tmp_path / "docs"
    (docs / "sub").mkdir(parents=True)

    sha_ok = sm.write_snapshot("clean body", cache)
    (docs / "clean.md").write_text(_doc([sm.manifest_line(
        "c1", "u", sha_ok, "2026-05-18T00:00:00+00:00", "defuddle", "-")],
        body=f"prose [^h:{sha_ok[:8]}]"))

    # Defective: duplicate claim_tag across two manifest lines (flagged
    # unconditionally by check_research_snapshots).
    sha_b1 = sm.write_snapshot("body one", cache)
    sha_b2 = sm.write_snapshot("body two", cache)
    (docs / "sub" / "bad.md").write_text(_doc([
        sm.manifest_line("c1", "u2", sha_b1,
                         "2026-05-18T00:00:00+00:00", "defuddle", "-"),
        sm.manifest_line("c1", "u3", sha_b2,
                         "2026-05-18T00:00:00+00:00", "defuddle", "-")],
        body=f"prose [^h:{sha_b1[:8]}] [^h:{sha_b2[:8]}]"))

    rc = ca.main(["--docs-dir", str(docs), "--cache-dir", str(cache)])
    out = capsys.readouterr().out

    assert rc == 1, "orchestrator must exit non-zero on any discovered defect"
    assert "bad.md" in out and "COVERAGE[research-snapshot]" in out
    assert "clean.md" not in out, "clean doc must not be flagged"


def test_all_clean_exits_0(tmp_path, capsys):
    cache = tmp_path / "cache"
    docs = tmp_path / "docs"
    docs.mkdir()
    sha = sm.write_snapshot("body", cache)
    (docs / "r.md").write_text(_doc([sm.manifest_line(
        "c1", "u", sha, "2026-05-18T00:00:00+00:00", "defuddle", "-")],
        body=f"prose [^h:{sha[:8]}]"))
    rc = ca.main(["--docs-dir", str(docs), "--cache-dir", str(cache)])
    assert rc == 0
    assert capsys.readouterr().out == ""


def test_docs_without_manifest_block_skipped(tmp_path, capsys):
    """A plain note (no provenance-manifest) is not a pipeline artifact."""
    cache = tmp_path / "cache"
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "note.md").write_text("# just a note\n\nno manifest here\n")
    rc = ca.main(["--docs-dir", str(docs), "--cache-dir", str(cache)])
    assert rc == 0
    assert capsys.readouterr().out == ""


def test_discovers_and_flags_bad_subagent_report(tmp_path, capsys):
    """Subagent reports under --reports-dir get check_subagent_report run
    on each, without the caller enumerating them."""
    cache = tmp_path / "cache"
    docs = tmp_path / "docs"
    reports = tmp_path / "reports"
    docs.mkdir()
    reports.mkdir()
    (reports / "sub1.txt").write_text("nope")  # empty-or-too-short
    rc = ca.main(["--docs-dir", str(docs), "--cache-dir", str(cache),
                  "--reports-dir", str(reports)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "sub1.txt" in out and "SUBAGENT[report]" in out
