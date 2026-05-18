import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))
import snapshot_manifest as sm


def test_content_sha256_is_deterministic_and_hex64():
    h = sm.content_sha256("hello world")
    assert h == sm.content_sha256("hello world")
    assert len(h) == 64 and all(c in "0123456789abcdef" for c in h)


def test_write_snapshot_is_content_addressed_and_idempotent(tmp_path):
    sha1 = sm.write_snapshot("body A", tmp_path)
    sha2 = sm.write_snapshot("body A", tmp_path)
    assert sha1 == sha2
    f = tmp_path / f"{sha1}.md"
    assert f.read_text(encoding="utf-8") == "body A"
    assert list(tmp_path.iterdir()) == [f]


def test_manifest_line_is_six_tab_fields_in_order():
    line = sm.manifest_line("c1", "https://x.test/a", "deadbeef" * 8,
                            "2026-05-17T12:00:00+00:00", "defuddle", "p.3")
    parts = line.split("\t")
    assert parts == ["c1", "https://x.test/a", "deadbeef" * 8,
                     "2026-05-17T12:00:00+00:00", "defuddle", "p.3"]


def test_record_writes_snapshot_and_returns_parseable_line(tmp_path):
    line = sm.record("the body", claim_tag="c2", url="https://x.test/b",
                     tool="firecrawl", locator="sec-2", cache_dir=tmp_path,
                     retrieved_at="2026-05-17T12:00:00+00:00")
    parsed = sm.parse_manifest_line(line)
    assert parsed.claim_tag == "c2" and parsed.tool == "firecrawl"
    assert (tmp_path / f"{parsed.sha256}.md").read_text(encoding="utf-8") == "the body"


def test_record_defaults_retrieved_at_to_utc_iso(tmp_path):
    line = sm.record("b", claim_tag="c", url="u", tool="defuddle",
                     locator="-", cache_dir=tmp_path)
    iso = sm.parse_manifest_line(line).retrieved_at
    from datetime import datetime
    dt = datetime.fromisoformat(iso)
    assert dt.tzinfo is not None
