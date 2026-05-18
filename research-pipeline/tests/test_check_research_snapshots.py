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


# --- v1.1: coverage-honesty + manifest-citation + claim_tag gates ----------

def _snap(i, cache_dir):
    """Write snapshot body 'snap-i', return its content sha256."""
    return sm.write_snapshot(f"snap-{i}", cache_dir)


def _line(tag, sha):
    return sm.manifest_line(tag, "https://e.x/" + tag, sha,
                            "2026-05-17T00:00:00+00:00", "defuddle", "-")


def _cited_doc(manifest_lines, body):
    block = "\n".join(manifest_lines)
    return f"# Doc\n\n{body}\n\n```provenance-manifest\n{block}\n```\n"


def _shas(n, cache_dir):
    return [_snap(i, cache_dir) for i in range(n)]


def test_coverage_overclaim_flagged(tmp_path, capsys):
    """22 distinct cited snapshots but 'Verbatim-гейт: 10/10 PASS ... каждую
    цитату' — incomplete verification presented as complete (failure-class 5).
    """
    cache = tmp_path / "cache"
    shas = _shas(22, cache)
    body = ("Provenance: Verbatim-гейт: **10/10 PASS** (независимый "
            "верификатор сверил каждую цитату с кэшированным снапшотом).\n\n"
            + " ".join(f"[^h:{s[:8]}]" for s in shas))
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line(f"A{i}", s) for i, s in enumerate(shas)],
                              body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out
    assert "10" in out and "22" in out


def test_honest_coverage_not_flagged(tmp_path, capsys):
    """N/total + explicit scope disclosure (the baseline-honest phrasing)
    must NOT trip the coverage gate (FP≈0)."""
    cache = tmp_path / "cache"
    shas = _shas(22, cache)
    body = ("Provenance: независимая верификация — 10 несущих из 22, "
            "детерминированные гейты ok; 15% tripwire-выборка из остальных "
            "12 ok; прочие без отдельного verdict-а.\n\n"
            + " ".join(f"[^h:{s[:8]}]" for s in shas))
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line(f"A{i}", s) for i, s in enumerate(shas)],
                              body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert "COVERAGE[research-snapshot]" not in out
    assert rc == 0


def test_uncited_manifest_line_flagged(tmp_path, capsys):
    """Manifest carries a snapshot the body never cites (24-vs-22 case)."""
    cache = tmp_path / "cache"
    shas = _shas(3, cache)
    body = f"Cited: [^h:{shas[0][:8]}] [^h:{shas[1][:8]}]"  # shas[2] uncited
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line(f"A{i}", s) for i, s in enumerate(shas)],
                              body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out
    assert shas[2][:8] in out and "not cited" in out


def test_cited_without_manifest_flagged(tmp_path, capsys):
    """A claim footnotes [^h:sha8] but no manifest line backs it — canonized
    without provenance (dangerous inverse of uncited-manifest)."""
    cache = tmp_path / "cache"
    shas = _shas(2, cache)
    ghost = "deadbeefdeadbeef"                  # cited, never in manifest
    body = (f"Cited: [^h:{shas[0][:8]}] and an unbacked claim [^h:{ghost[:8]}]")
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("A0", shas[0])], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out
    assert ghost[:8] in out and "no manifest" in out


def test_thin_snapshot_when_heavier_same_url_in_cache_flagged(tmp_path, capsys):
    """Re-synthesis cited the light capture of a URL while a much heavier
    capture of the SAME URL sits uncited in the cache index (v1.3)."""
    cache = tmp_path / "cache"
    url = "https://reg.example/inspection-report?id=220"
    thin = sm.parse_manifest_line(sm.record(
        "Overall: Acceptable.", claim_tag="c1", url=url, tool="defuddle",
        locator="-", cache_dir=cache,
        retrieved_at="2026-05-17T00:00:00+00:00")).sha256
    sm.record("Year-by-year: 2008-09 Good, 2009-10 Good, 2010-11 Acceptable "
              * 80, claim_tag="c2", url=url, tool="curl+pdftotext",
              locator="-", cache_dir=cache,
              retrieved_at="2026-05-17T01:00:00+00:00")
    body = f"The rating is Acceptable.[^h:{thin[:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", thin)], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out
    assert thin[:8] in out and "heavier" in out


def test_cited_heaviest_snapshot_not_flagged(tmp_path, capsys):
    """Citing the heaviest capture of a URL must not trip the v1.3 gate."""
    cache = tmp_path / "cache"
    url = "https://reg.example/r?id=1"
    heavy = sm.parse_manifest_line(sm.record(
        "deep inspection report " * 200, claim_tag="c1", url=url,
        tool="curl", locator="-", cache_dir=cache,
        retrieved_at="2026-05-17T00:00:00+00:00")).sha256
    sm.record("short summary", claim_tag="c2", url=url, tool="defuddle",
              locator="-", cache_dir=cache,
              retrieved_at="2026-05-17T01:00:00+00:00")
    body = f"Detail from the deep report.[^h:{heavy[:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", heavy)], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert "heavier" not in out and rc == 0


def test_no_index_means_thin_gate_inert(tmp_path, capsys):
    """Legacy cache with no index.tsv -> v1.3 gate stays silent (FP≈0)."""
    cache = tmp_path / "cache"
    shas = _shas(2, cache)                      # write_snapshot, no index.tsv
    body = f"Cited [^h:{shas[0][:8]}] [^h:{shas[1][:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", shas[0]), _line("c2", shas[1])],
                              body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert "heavier" not in out and rc == 0


def test_duplicate_claim_tag_flagged(tmp_path, capsys):
    """claim_tag must be unique within a manifest (minimal 'use it')."""
    cache = tmp_path / "cache"
    shas = _shas(2, cache)
    body = f"Cited: [^h:{shas[0][:8]}] [^h:{shas[1][:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("A1", shas[0]), _line("A1", shas[1])],
                              body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out and "claim_tag" in out
    assert "A1" in out


# --- v1.5: re-synthesis declaration -> depth obligation -------------------

_RESYNTH_PROSE = (
    "Текущая работа — обоснованно соразмерный ре-синтез с фокусом на Дубай "
    "поверх уже воспроизводимых content-addressed снапшотов. Повторный "
    "fetch уже закэшированного не выполнялся намеренно."
)


def test_resynthesis_declared_without_dispatch_flagged(tmp_path, capsys):
    """Re-synthesis declared but no machine-readable adversary-dispatch
    record -> COVERAGE (Stage 0: inline re-attack silently coarsens)."""
    cache = tmp_path / "cache"
    shas = _shas(1, cache)
    body = f"{_RESYNTH_PROSE}\n\nFinding [^h:{shas[0][:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", shas[0])], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out and "re-synthesis" in out


def test_resynthesis_with_dispatch_record_clean(tmp_path, capsys):
    """A machine-readable adversary-dispatch record satisfies the Stage 0
    obligation -> not flagged."""
    cache = tmp_path / "cache"
    shas = _shas(1, cache)
    body = (f"{_RESYNTH_PROSE}\n\n"
            f"adversary-dispatch: subagent=skeptic report=ab12cd34 "
            f"verdict=survived\n\nFinding [^h:{shas[0][:8]}]")
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", shas[0])], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 0
    assert "re-synthesis" not in out


def test_no_resynthesis_marker_inert(tmp_path, capsys):
    """No re-synthesis declaration -> gate stays silent even with no
    dispatch record (FP≈0; fresh-fetch docs are unaffected)."""
    cache = tmp_path / "cache"
    shas = _shas(1, cache)
    body = f"Fresh research, all sources fetched. Finding [^h:{shas[0][:8]}]"
    doc = tmp_path / "r.md"
    doc.write_text(_cited_doc([_line("c1", shas[0])], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 0
    assert "re-synthesis" not in out


def test_real_choueifat_resynthesis_case_flagged(tmp_path, capsys):
    """Regression from the real artifact, hard-wrapped declaration
    sentence included (the [^.\\n] vs [^.] regression): declares
    re-synthesis over the cache, adversarial only in prose, no
    machine-readable dispatch record."""
    cache = tmp_path / "cache"
    shas = _shas(1, cache)
    body = (
        "### Методологическая прозрачность\n"
        "- **Stage 0:** полный fan-out исполнен ранее. Текущая работа —\n"
        "  обоснованно соразмерный ре-синтез с фокусом на Дубай и переводом "
        "на русский\n"
        "  **поверх уже воспроизводимых content-addressed снапшотов**, плюс "
        "свежий\n"
        "  adversarial-проход по несущим утверждениям. Повторный fetch уже\n"
        "  закэшированного не выполнялся намеренно — снапшоты по построению\n"
        "  воспроизводимы.\n"
        "- **Adversarial-проход:** несущие утверждения атакованы на\n"
        "  опровержение; вердикты проставлены метками.\n\n"
        f"Рейтинг KHDA [^h:{shas[0][:8]}]"
    )
    doc = tmp_path / "choueifat.md"
    doc.write_text(_cited_doc([_line("c1", shas[0])], body))
    rc = crs.main(["--doc", str(doc), "--cache-dir", str(cache)])
    out = capsys.readouterr().out
    assert rc == 1
    assert "COVERAGE[research-snapshot]" in out and "re-synthesis" in out
