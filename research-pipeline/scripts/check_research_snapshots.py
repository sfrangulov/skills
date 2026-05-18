"""G-style report-only checker for provenance-manifest blocks.

Lines:
  DRIFT[research-snapshot]:    <doc>:<sha8>: <reason> [hint]   (advisory; sources change)
  COVERAGE[research-snapshot]: <doc>:<scope>: <reason> [hint]  (author defect; fix it)
Exit: 0 clean | 1 finding reported | 2 usage error.

DRIFT is advisory (external sources legitimately change). COVERAGE is NOT —
it catches incomplete-verification-presented-as-complete (failure-class 5),
a degradation entirely within the author's control. Same exit code, distinct
prefix: drift you may accept, coverage you fix.
"""
from __future__ import annotations
import argparse, re, sys
from pathlib import Path

import snapshot_manifest as sm

_BLOCK = re.compile(r"```provenance-manifest\n(.*?)\n```", re.DOTALL)
_CITE = re.compile(r"\[\^h:([0-9a-f]{6,64})\]")

# A line is "verification context" if it names the gate/act of verifying.
_VCTX = re.compile(
    r"verbatim|вербатим|верифик|verification|verified|свер(?:ен|ил|я)|"
    r"\bгейт\b|\bgate\b", re.IGNORECASE)
# Explicit honest scoping — presence anywhere in vctx clears the gate.
_DISCLOSURE = re.compile(
    r"выборк|сэмпл|sampl|trip-?wire|из\s+\d+|\bof\s+\d+|остальны|"
    r"не\s+проход|без\s+(?:отдельн\w+\s+)?verdict|/\s*total", re.IGNORECASE)
_FRAC = re.compile(r"\b(\d+)\s*/\s*(\d+)\b")
# Totalizing claim with no number ("every quote", "каждую цитату", ...).
_TOTAL = re.compile(
    r"кажд\w*\s+цитат|вс[ехй]+\s+цитат|every\s+(?:cited\s+)?(?:quote|claim|citation)|"
    r"all\s+(?:cited\s+)?(?:quotes|claims|citations)|полн\w*\s+покрыт",
    re.IGNORECASE)


def cited_sha_tokens(body: str) -> set[str]:
    """Distinct sha tokens cited via the [^h:<sha>] footnote convention."""
    return set(_CITE.findall(body))


def coverage_finding(doc_text: str, doc_name: str, n_cited: int) -> str | None:
    """Flag a verbatim/verification claim that overstates coverage relative to
    the cited-snapshot universe, with no sampling/scope disclosure."""
    if n_cited <= 0:
        return None                       # doc not using the citation convention
    vctx = " ".join(ln for ln in doc_text.splitlines() if _VCTX.search(ln))
    if not vctx or _DISCLOSURE.search(vctx):
        return None                       # nothing claimed, or honestly scoped
    for n, m in _FRAC.findall(vctx):
        if int(m) < n_cited:
            return (f"COVERAGE[research-snapshot]: {doc_name}:{n}/{m}cited: "
                    f"verbatim-coverage claim scopes {m} but {n_cited} distinct "
                    f"snapshots are cited; no sampling disclosure "
                    f"[report N/{n_cited} or disclose 'K of M sampled']")
    if _TOTAL.search(vctx):
        return (f"COVERAGE[research-snapshot]: {doc_name}:0/{n_cited}cited: "
                f"totalizing verification claim over {n_cited} cited snapshots "
                f"with no count or sampling disclosure "
                f"[report N/{n_cited} or disclose 'K of M sampled']")
    return None


def manifest_findings(manifest: list[sm.ManifestLine], doc_text: str,
                       doc_name: str, n_cited: int) -> list[str]:
    out: list[str] = []
    seen: dict[str, int] = {}
    for ml in manifest:
        seen[ml.claim_tag] = seen.get(ml.claim_tag, 0) + 1
    for tag, c in seen.items():
        if c > 1:
            out.append(f"COVERAGE[research-snapshot]: {doc_name}:tag={tag}: "
                       f"claim_tag repeated {c}x in manifest "
                       f"[claim_tag must be unique per snapshot]")
    if n_cited > 0:                        # uncited check needs the convention
        toks = cited_sha_tokens(doc_text)
        for ml in manifest:
            if not any(ml.sha256.startswith(t) for t in toks):
                out.append(f"COVERAGE[research-snapshot]: "
                           f"{doc_name}:{ml.sha256[:8]}: manifest snapshot not "
                           f"cited in body [drop the snapshot or cite it "
                           f"[^h:{ml.sha256[:8]}]]")
    return out


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
    doc_text = doc_path.read_text(encoding="utf-8")
    n_cited = len(cited_sha_tokens(doc_text))
    drift = [d for ml in manifest
             if (d := check_line(ml, Path(a.cache_dir), doc_path.name))]
    cover = manifest_findings(manifest, doc_text, doc_path.name, n_cited)
    if (c := coverage_finding(doc_text, doc_path.name, n_cited)):
        cover.append(c)
    for line in (*drift, *cover):
        print(line)
    return 1 if (drift or cover) else 0


if __name__ == "__main__":
    raise SystemExit(main())
