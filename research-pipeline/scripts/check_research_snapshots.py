"""G-style report-only drift checker for provenance-manifest blocks.

Line contract:  DRIFT[research-snapshot]: <doc>:<sha8>: <reason> [hint]
Exit: 0 clean | 1 drift reported (report-only, NOT a gate) | 2 usage error.
External sources legitimately change -> drift is advisory, never blocking.
"""
from __future__ import annotations
import argparse, re, sys
from pathlib import Path

import snapshot_manifest as sm

_BLOCK = re.compile(r"```provenance-manifest\n(.*?)\n```", re.DOTALL)


def extract_manifest(doc_text: str) -> list[sm.ManifestLine] | None:
    m = _BLOCK.search(doc_text)
    if not m:
        return None
    lines = [ln for ln in m.group(1).splitlines() if ln.strip()]
    return [sm.parse_manifest_line(ln) for ln in lines]   # may raise ValueError


def check_line(ml: sm.ManifestLine, cache_dir: Path, doc_name: str) -> str | None:
    snap = cache_dir / f"{ml.sha256}.md"
    sha8 = ml.sha256[:8]
    if not snap.exists():
        return (f"DRIFT[research-snapshot]: {doc_name}:{sha8}: "
                f"cache-miss [re-fetch via {ml.tool} from {ml.url}]")
    actual = sm.content_sha256(snap.read_text(encoding="utf-8"))
    if actual != ml.sha256:
        return (f"DRIFT[research-snapshot]: {doc_name}:{sha8}: "
                f"sha-mismatch [snapshot body changed; recompute={actual[:8]}]")
    return None


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Report provenance-manifest drift.")
    p.add_argument("--doc", required=True)
    p.add_argument("--cache-dir", required=True)
    a = p.parse_args(argv)
    doc_path = Path(a.doc)
    if not doc_path.exists():
        print(f"usage: doc not found: {doc_path}", file=sys.stderr)
        return 2
    try:
        manifest = extract_manifest(doc_path.read_text(encoding="utf-8"))
    except ValueError as e:
        print(f"manifest parse error: {e}", file=sys.stderr)
        return 2
    if manifest is None:
        return 0                                  # no block -> nothing to check
    drift = [d for ml in manifest
             if (d := check_line(ml, Path(a.cache_dir), doc_path.name))]
    for d in drift:
        print(d)
    return 1 if drift else 0


if __name__ == "__main__":
    raise SystemExit(main())
