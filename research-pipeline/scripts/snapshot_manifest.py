"""Content-addressed snapshot cache + provenance-manifest TSV line.

Snapshot name = sha256(body utf-8). Manifest TSV fields, in order:
    claim_tag \t url \t sha256 \t retrieved_at(ISO) \t tool \t locator
"""
from __future__ import annotations
import argparse, hashlib, sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

FIELDS = ("claim_tag", "url", "sha256", "retrieved_at", "tool", "locator")


def content_sha256(body: str) -> str:
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def write_snapshot(body: str, cache_dir: Path) -> str:
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    sha = content_sha256(body)
    path = cache_dir / f"{sha}.md"
    if not path.exists():                       # content-addressed -> idempotent
        path.write_text(body, encoding="utf-8")
    return sha


def manifest_line(claim_tag: str, url: str, sha256: str,
                  retrieved_at: str, tool: str, locator: str) -> str:
    vals = (claim_tag, url, sha256, retrieved_at, tool, locator)
    for v in vals:
        if "\t" in v or "\n" in v:
            raise ValueError(f"manifest field must not contain tab/newline: {v!r}")
    return "\t".join(vals)


@dataclass(frozen=True)
class ManifestLine:
    claim_tag: str
    url: str
    sha256: str
    retrieved_at: str
    tool: str
    locator: str


def parse_manifest_line(line: str) -> ManifestLine:
    parts = line.rstrip("\n").split("\t")
    if len(parts) != len(FIELDS):
        raise ValueError(f"expected {len(FIELDS)} tab fields, got {len(parts)}")
    return ManifestLine(*parts)


def _utc_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


INDEX_NAME = "index.tsv"


@dataclass(frozen=True)
class IndexEntry:
    sha256: str
    bytes: int
    url: str
    retrieved_at: str


def read_index(cache_dir: Path) -> list[IndexEntry]:
    """Persistent sha<->url<->bytes index; [] if absent (legacy cache)."""
    path = Path(cache_dir) / INDEX_NAME
    if not path.exists():
        return []
    out: list[IndexEntry] = []
    for ln in path.read_text(encoding="utf-8").splitlines():
        if not ln.strip():
            continue
        sha, b, url, ts = ln.split("\t")
        out.append(IndexEntry(sha, int(b), url, ts))
    return out


def update_index(cache_dir: Path, sha256: str, nbytes: int, url: str,
                  retrieved_at: str) -> None:
    """Append one row per distinct sha (content-addressed -> idempotent)."""
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    if any(e.sha256 == sha256 for e in read_index(cache_dir)):
        return
    for v in (sha256, url, retrieved_at):
        if "\t" in v or "\n" in v:
            raise ValueError(f"index field must not contain tab/newline: {v!r}")
    with (cache_dir / INDEX_NAME).open("a", encoding="utf-8") as f:
        f.write(f"{sha256}\t{nbytes}\t{url}\t{retrieved_at}\n")


def record(body: str, *, claim_tag: str, url: str, tool: str, locator: str,
           cache_dir: Path, retrieved_at: str | None = None) -> str:
    sha = write_snapshot(body, cache_dir)
    ts = retrieved_at or _utc_iso_now()
    update_index(cache_dir, sha, len(body.encode("utf-8")), url, ts)
    return manifest_line(claim_tag, url, sha, ts, tool, locator)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Record a snapshot + emit manifest line.")
    p.add_argument("--claim-tag", required=True)
    p.add_argument("--url", required=True)
    p.add_argument("--tool", required=True)
    p.add_argument("--locator", default="-")
    p.add_argument("--cache-dir", required=True)
    p.add_argument("--retrieved-at", default=None)
    a = p.parse_args(argv)
    body = sys.stdin.read()
    print(record(body, claim_tag=a.claim_tag, url=a.url, tool=a.tool,
                  locator=a.locator, cache_dir=Path(a.cache_dir),
                  retrieved_at=a.retrieved_at))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
