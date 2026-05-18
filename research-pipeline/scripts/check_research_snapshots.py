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
    if n_cited > 0:                        # both directions need the convention
        toks = cited_sha_tokens(doc_text)
        for ml in manifest:
            if not any(ml.sha256.startswith(t) for t in toks):
                out.append(f"COVERAGE[research-snapshot]: "
                           f"{doc_name}:{ml.sha256[:8]}: manifest snapshot not "
                           f"cited in body [drop the snapshot or cite it "
                           f"[^h:{ml.sha256[:8]}]]")
        for t in sorted(toks):
            if not any(ml.sha256.startswith(t) for ml in manifest):
                out.append(f"COVERAGE[research-snapshot]: {doc_name}:{t}: "
                           f"cited [^h:{t}] has no manifest line — claim "
                           f"canonized without provenance [snapshot the "
                           f"source or drop the claim]")
    return out


def thin_snapshot_findings(manifest: list[sm.ManifestLine], cache_dir: Path,
                           doc_name: str) -> list[str]:
    """A cited snapshot is the thin capture of its URL while a much heavier
    capture of the SAME URL sits uncited in the cache index (re-synthesis
    leaning on the light page instead of the deep source). Inert with no
    index (legacy cache) -> FP≈0."""
    idx = sm.read_index(cache_dir)
    if not idx:
        return []
    by_sha = {e.sha256: e for e in idx}
    by_url: dict[str, list] = {}
    for e in idx:
        by_url.setdefault(e.url, []).append(e)
    cited = {ml.sha256 for ml in manifest}
    out, seen = [], set()
    for ml in manifest:
        if ml.sha256 in seen:
            continue
        seen.add(ml.sha256)
        e = by_sha.get(ml.sha256)
        if not e:
            continue
        heavy = max(by_url[e.url], key=lambda x: x.bytes)
        if (heavy.sha256 != e.sha256 and heavy.sha256 not in cited
                and heavy.bytes >= 1.5 * e.bytes
                and heavy.bytes - e.bytes >= 2000):
            out.append(
                f"COVERAGE[research-snapshot]: {doc_name}:{e.sha256[:8]}: "
                f"thinner snapshot cited ({e.bytes}B) — cache has a heavier "
                f"capture {heavy.sha256[:8]} ({heavy.bytes}B, "
                f"~{heavy.bytes / e.bytes:.1f}x) of the same URL, not cited "
                f"[open the deeper capture or justify the thin one]")
    return out


# v1.5: a doc that *declares* re-synthesis over an existing cache owes a
# depth obligation (Stage 0): for load-bearing claims it must open the
# deepest cached source AND re-run the adversarial pass as a *dispatched*
# sub-agent, not an inline self-check. The same-URL thin-vs-heavy half is
# v1.3's job (needs the index). What v1.3 cannot see is the declaration ->
# obligation link: re-synthesis claimed, adversary only re-attacked inline.
# A machine-readable `adversary-dispatch:` record is the deterministic
# proof the dispatched pass happened; prose ("атакованы на опровержение")
# is exactly the silent coarsening. Inert without the marker -> FP≈0.
# [^.] (not [^.\n]) so a single declaration sentence still matches when
# the doc is hard-wrapped across lines; the period bound keeps it inside
# one sentence -> FP-tight.
_RESYNTH = re.compile(
    r"ре-?синтез[^.]{0,140}(?:снапшот|кэш|cache)|"
    r"повторн\w*\s+fetch[^.]{0,100}не\s+выполн|"
    r"re-?synth\w*[^.]{0,140}(?:cache|snapshot)|"
    r"re-?fetch[^.]{0,80}(?:skip|not\s+perform)",
    re.IGNORECASE)
_ADV_DISPATCH = re.compile(r"(?mi)^\s*[-*]?\s*adversary-dispatch\s*:")


def resynthesis_findings(doc_text: str, doc_name: str) -> list[str]:
    if not _RESYNTH.search(doc_text):
        return []                       # no re-synthesis claim -> inert
    if _ADV_DISPATCH.search(doc_text):
        return []                       # Stage-0 honest path: dispatch recorded
    return [f"COVERAGE[research-snapshot]: {doc_name}:re-synthesis: "
            f"re-synthesis over the cache declared but no machine-readable "
            f"`adversary-dispatch:` record — load-bearing claims re-attacked "
            f"inline (Stage 0: a dispatched adversary sub-agent or the "
            f"deepest cached source is required, not an inline self-check) "
            f"[add an `adversary-dispatch:` record or drop the "
            f"re-synthesis claim]"]


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
    cover += thin_snapshot_findings(manifest, Path(a.cache_dir), doc_path.name)
    cover += resynthesis_findings(doc_text, doc_path.name)
    if (c := coverage_finding(doc_text, doc_path.name, n_cited)):
        cover.append(c)
    for line in (*drift, *cover):
        print(line)
    return 1 if (drift or cover) else 0


if __name__ == "__main__":
    raise SystemExit(main())
