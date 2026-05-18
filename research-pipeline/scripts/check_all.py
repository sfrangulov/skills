"""v1.4 gate-enforcement orchestrator: run the deterministic gates on
EVERY pipeline artifact under a root, by discovery — not by the agent
remembering to invoke them per file.

  --docs-dir     recursively: every *.md carrying a provenance-manifest
                 block -> check_research_snapshots
  --reports-dir  recursively: every *.md/*.txt -> check_subagent_report
  --cache-dir    snapshot cache for the snapshot checker

Findings are aggregated and printed; exit 1 if ANY artifact is flagged,
0 only when all discovered artifacts are clean. This is the mechanism a
Stop-hook / CI invokes so a defective doc cannot pass merely because the
per-doc checker was never run by hand.

Exit: 0 all clean | 1 finding(s) reported | 2 usage error.
"""
from __future__ import annotations
import argparse, io, sys
from contextlib import redirect_stdout
from pathlib import Path

import check_research_snapshots as crs
import check_subagent_report as csr


def _doc_has_manifest(text: str) -> bool:
    return crs._BLOCK.search(text) is not None


def discover_docs(docs_dir: Path) -> list[Path]:
    return sorted(p for p in docs_dir.rglob("*.md")
                  if _doc_has_manifest(p.read_text(encoding="utf-8")))


def discover_reports(reports_dir: Path) -> list[Path]:
    return sorted(p for p in reports_dir.rglob("*")
                  if p.is_file() and p.suffix in (".md", ".txt"))


def _run_capture(fn, argv: list[str]) -> tuple[int, str]:
    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = fn(argv)
    return rc, buf.getvalue()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Run all research gates by discovery.")
    p.add_argument("--docs-dir", required=True)
    p.add_argument("--cache-dir", required=True)
    p.add_argument("--reports-dir")
    a = p.parse_args(argv)

    docs_dir = Path(a.docs_dir)
    if not docs_dir.is_dir():
        print(f"usage: docs-dir not found: {docs_dir}", file=sys.stderr)
        return 2

    findings = False
    for doc in discover_docs(docs_dir):
        rc, out = _run_capture(
            crs.main, ["--doc", str(doc), "--cache-dir", a.cache_dir])
        if rc == 2:
            print(f"usage: {doc.name}: manifest parse error", file=sys.stderr)
            return 2
        if out:
            sys.stdout.write(out)
        if rc != 0:
            findings = True

    if a.reports_dir:
        reports_dir = Path(a.reports_dir)
        if not reports_dir.is_dir():
            print(f"usage: reports-dir not found: {reports_dir}",
                  file=sys.stderr)
            return 2
        for rep in discover_reports(reports_dir):
            rc, out = _run_capture(csr.main, ["--report", str(rep)])
            for ln in out.splitlines():
                print(f"{rep.name}: {ln}")
            if rc != 0:
                findings = True

    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
