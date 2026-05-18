# research-pipeline

Disciplined multi-source research that produces a **verifiable,
snapshot-backed** document: every canonized claim points at a
content-addressed snapshot, survives an adversarial pass, and is checked
by deterministic gates. The skill itself lives in [SKILL.md](SKILL.md) —
this file is only what must be **installed and configured** for it to
work correctly.

## Prerequisites

| Requirement | Why | Check / install |
|---|---|---|
| **python3** (3.9+) | The bundled gates/tools run via `python3` (never a bare `python`). | `python3 --version` |
| **defuddle CLI** | Stage 4 tier-1 verbatim fetch (clean markdown). | `command -v defuddle` · install per Defuddle CLI docs (or the bundled `defuddle` skill) |
| **firecrawl CLI** | Stage 4 tier-2 fetch for JS / anti-bot pages (Cloudflare, etc.) where defuddle gets a 403/JS-shell. | `command -v firecrawl` · install per Firecrawl CLI docs |
| **WebSearch / WebFetch** | Discovery (tier 3) and triage only. Provided by the agent harness — nothing to install. **WebFetch is barred as a verbatim tier** (it paraphrases). | n/a |
| **pytest** | Only to run the bundled test suite (`tests/`) — not needed for normal use. | `python3 -m pytest -q` from the skill dir |

**No API keys are required.** All four bundled scripts are offline and
operate on local files / the snapshot cache.

## Configuration

### Snapshot cache (required)

Stage 4 writes content-addressed snapshots and a manifest index here:

```
~/.cache/agent-research/snapshots
```

It is created automatically by `scripts/snapshot_manifest.py`. The cache
is machine-local and gitignored; the **provenance-manifest block in the
document is the canon** — on a fresh machine a cache-miss is re-fetched by
the recorded `tool`. Override the location by passing `--cache-dir` to the
scripts (keep it consistent across a project).

### Gate enforcement (recommended — v1.4)

The deterministic gates only protect you if they actually run.
`scripts/check_all.py` discovers every doc with a `provenance-manifest`
block and every subagent report under a root and runs both checkers:

```bash
python3 scripts/check_all.py --docs-dir docs/research \
  --cache-dir ~/.cache/agent-research/snapshots [--reports-dir <dir>]
```

To have the harness run it without you remembering, wire the bundled Stop
hook into Claude Code `settings.json`:

```json
{ "hooks": { "Stop": [ { "hooks": [ { "type": "command",
  "command": "RESEARCH_DOCS_DIR=docs/research bash ~/.agents/skills/research-pipeline/hooks/research-gates-stop.sh" } ] } ] } }
```

Hook environment (all optional, sane defaults):

| Var | Default | Meaning |
|---|---|---|
| `RESEARCH_DOCS_DIR` | `./docs/research` | docs root to scan |
| `RESEARCH_CACHE_DIR` | `~/.cache/agent-research/snapshots` | snapshot cache |
| `RESEARCH_REPORTS_DIR` | _(unset)_ | subagent-report dir, scanned if set |

A non-zero exit prints the flagged artifacts to stderr loudly. If the
docs dir does not exist the hook is a no-op (exit 0), so it is safe to
enable globally.

## Updating the installed copy

This skill is installed as a directory copy under `~/.agents/skills/`.
After changes are merged upstream, reinstall with the **latest** package
so the CLI does not serve a cached older version:

```bash
npx skills@latest add sfrangulov/skills --skill research-pipeline
```

Then `/reload-plugins` (Claude Code). Verify with
`python3 -m pytest -q` inside `~/.agents/skills/research-pipeline`.

## Verifying the install

From the skill directory (repo or installed copy):

```bash
python3 -m pytest -q          # full gate test suite, must be all green
python3 scripts/check_all.py --docs-dir docs/research \
  --cache-dir ~/.cache/agent-research/snapshots   # exit 0 = clean
```
