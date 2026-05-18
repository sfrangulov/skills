import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))
import snapshot_manifest as sm
import check_research_snapshots as crs


def _doc(manifest_lines: list[str]) -> str:
    body = "\n".join(manifest_lines)
    return f"# Doc\n\nsome prose\n\n```provenance-manifest\n{body}\n```\n"


def test_clean_doc_exits_0_no_drift(tmp_path, capsys):
    sha = sm.write_snapshot("page body", tmp_path / "cache")
    doc = tmp_path / "r.md"
    doc.write_text(_doc([sm.manifest_line(
        "c1", "u", sha, "2026-05-17T00:00:00+00:00", "defuddle", "-")]))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(tmp_path / "cache")])
    assert rc == 0
    assert "DRIFT[research-snapshot]" not in capsys.readouterr().out


def test_tampered_snapshot_reports_drift_exit_1(tmp_path, capsys):
    cache = tmp_path / "cache"
    sha = sm.write_snapshot("original", cache)
    (cache / f"{sha}.md").write_text("TAMPERED", encoding="utf-8")
    doc = tmp_path / "r.md"
    doc.write_text(_doc([sm.manifest_line(
        "c1", "u", sha, "2026-05-17T00:00:00+00:00", "defuddle", "-")]))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert out.startswith("DRIFT[research-snapshot]: ")
    assert sha[:8] in out and "sha-mismatch" in out


def test_missing_cache_is_advisory_drift_exit_1(tmp_path, capsys):
    doc = tmp_path / "r.md"
    doc.write_text(_doc([sm.manifest_line(
        "c1", "u", "a" * 64, "2026-05-17T00:00:00+00:00", "firecrawl", "-")]))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(tmp_path / "cache")])
    out = capsys.readouterr().out
    assert rc == 1 and "cache-miss" in out and "re-fetch via firecrawl" in out


def test_malformed_manifest_exits_2(tmp_path, capsys):
    doc = tmp_path / "r.md"
    doc.write_text("# Doc\n\n```provenance-manifest\nonly\ttwo\n```\n")
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(tmp_path)])
    assert rc == 2 and "manifest parse error" in capsys.readouterr().err


def test_no_manifest_block_exits_0(tmp_path, capsys):
    doc = tmp_path / "r.md"
    doc.write_text("# Doc\n\nno manifest here\n")
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(tmp_path)])
    assert rc == 0
