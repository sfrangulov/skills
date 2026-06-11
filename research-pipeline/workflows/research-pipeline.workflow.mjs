export const meta = {
  name: 'research-pipeline',
  description: 'Disciplined multi-source research as a deterministic Workflow: scope → fan-out search → fetch-contract+snapshot → verification funnel → quorum adversarial pass → canonize. Orchestration in code; all I/O (fetch, sha256 snapshot, deterministic gates) runs inside subagents via Bash. Explicit-invocation only.',
  whenToUse: 'A research document downstream code/decisions will lean on — source-grounded, fact-checked, reproducible across machines. Not a quick lookup (~15x tokens of a chat answer).',
  phases: [
    { title: 'Scope', detail: 'recon-triage + angles + effort tier (gap-scoping done pre-invocation)' },
    { title: 'Search', detail: 'one WebSearch agent per angle; barrier → global URL dedup' },
    { title: 'Fetch', detail: 'fetch-contract per unique source: defuddle→firecrawl→wayback, snapshot_manifest.py' },
    { title: 'Verify', detail: 'deterministic gates (URL/verbatim/co-occurrence) → judge on the flagged remainder' },
    { title: 'Adversarial', detail: '3-vote refute quorum on load-bearing claims (2/3 refutes kill)' },
    { title: 'Synthesize', detail: 'survived/weakened only → working form (manifest + [^h:sha]) → run gate → canonical emit' },
  ],
}

// ---------------------------------------------------------------------------
// DESIGN NOTES (read before editing)
//
// This is the orchestration layer of the `research-pipeline` skill, ported
// from prose ("you are the lead, dispatch 3-5 subagents") into deterministic
// code. What it ADOPTS from the built-in `deep-research` workflow:
//   - schema-forced subagent returns  -> validation upstream, model retries
//     on mismatch. Combined with the Fetch-stage barred-verbatim-tier enum and
//     the tier==manifest-tool rule, this folds in the invariants that
//     scripts/check_subagent_report.py enforced (structure, barred verbatim
//     tiers, declared-tier↔manifest-tool) — superseded, not silently dropped.
//   - 3-vote perspective-diverse adversarial quorum (2/3 refutes to kill)
//   - pipeline() so a claim verifies as soon as its source is fetched
//   - global URL-dedup before fetch (barrier) so we snapshot each URL once
//
// What it KEEPS from this skill (deep-research has none of it):
//   - content-addressed snapshots + provenance-manifest (reproducibility)
//   - deterministic verbatim-substring gate FIRST, judge only on remainder
//   - fetch-escalation contract; WebFetch barred as a verbatim tier
//   - epistemic tagging; contradiction as a first-class output
//   - the canonical emit form (frontmatter + ## Источники + provenance callout)
//
// THE I/O BOUNDARY (the whole reason this split exists):
//   The JS glue here has NO filesystem/network and Date.now/Math.random throw.
//   So every gate that touches the world — curl URL-resolve, defuddle/firecrawl
//   fetch, `python3 scripts/snapshot_manifest.py`, sha256, `check_*` — runs
//   INSIDE a subagent (which has Bash) or in the Stop hook. The script
//   dirigates; the tools verify. Pure data ops (dedup, vote tally, filtering)
//   stay in JS because they operate on what agents already returned.
//
// PRE-INVOCATION CONTRACT:
//   Stage -1a (gap-driven scoping, ≤3 questions to the user) CANNOT happen
//   inside a workflow — agents can't prompt the user. Do it in the main thread
//   first (like deep-research does), then pass the refined question + derived
//   assumptions as args. This script starts at Stage -1b (autonomous triage).
//
//   args: string (the refined question)  OR  {
//     question:    string   (required)
//     assumptions: string[] (derived assumptions recorded during scoping)
//     skillDir:    string   (OPTIONAL override; normally auto-resolved at runtime
//                            by the Scope agent — see SKILL_CANDIDATES below)
//     cacheDir:    string   (default ~/.cache/agent-research/snapshots)
//     docsDir:     string   (where to write the doc; default docs/research)
//     canonGate:   string   (OPTIONAL repo canonical-form gate, e.g.
//                            scripts/check-research-canonical.sh — run on the
//                            committed 7b form. Skip if the repo has no canon gate.)
//   }
//
// TWO GATES, OPPOSITE FOOTNOTE FORMATS (why Stage 7 is two-phase):
//   - skill gate (check_research_snapshots.py) demands [^h:<sha8>] — hash refs
//     into content-addressed snapshots (machine-reproducible). Runs on the 7a
//     WORKING form.
//   - repo canon gate (check-research-canonical.sh) demands the opposite: NO raw
//     [^h: refs survive; every footnote relabeled to a human [^slug]. Runs on the
//     7b COMMITTED form.
//   One committed file cannot satisfy both — they are mutually exclusive by design
//   (verification form vs reading form). The [^h:sha] coverage/citation proof
//   happens on 7a (skill_gate_exit==0 below) and is captured at run time — it is
//   NOT re-checkable on the committed 7b form, which has zero [^h:sha] refs, so
//   check_research_snapshots' coverage + body↔manifest-citation halves go inert
//   (n_cited==0). What STILL anchors 7b reproducibility: the provenance-manifest
//   TSV (sha256/source → snapshot/DRIFT + recon verdict_slot checks, which run
//   regardless of n_cited) plus the repo canon gate. So a Stop-hook re-run on the
//   committed form re-validates snapshots, not citation-completeness.
// ---------------------------------------------------------------------------

const QUESTION = typeof args === 'string' ? args : (args && args.question) || ''
if (!QUESTION.trim()) {
  throw new Error('research-pipeline: empty question. Do gap-driven scoping in the main thread first, then pass the refined question as args (string or {question}).')
}
// The skill installs anywhere — on this machine ~/.claude/skills/research-pipeline
// is a symlink → ~/.agents/skills/research-pipeline (the real install), while the
// dev source lives separately under ~/projects/skills/. JS glue has NO I/O, so the
// install dir CANNOT be resolved here. The Scope agent resolves it at runtime (it
// has Bash): probes these candidates in order, picks the first that actually holds
// scripts/ + references/, canonicalizes it. An explicit args.skillDir wins. Every
// downstream stage uses the resolved scope.skill_dir — never a hardcoded path.
const SKILL_CANDIDATES = [
  args && args.skillDir,            // explicit override
  '"$RP_SKILL_DIR"',                // env override, if the runtime exports one
  '~/.claude/skills/research-pipeline',
  '~/.agents/skills/research-pipeline',
].filter(Boolean)
const CACHE_DIR = (args && args.cacheDir) || '~/.cache/agent-research/snapshots'
const DOCS_DIR  = (args && args.docsDir)  || 'docs/research'
const CANON_GATE = (args && args.canonGate) || null // repo's canonical-form gate; run on the committed 7b form (null → repo has none)
const ASSUMPTIONS = (args && args.assumptions) || []

// ---- pure helpers (data agents returned — no I/O) -------------------------

function normUrl(u) {
  return String(u).trim().replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase()
}
const CLASS_RANK = { official: 0, primary: 1, 'authoritative-secondary': 2, general: 3 }
function dedupeByUrl(sources) {
  const best = new Map()
  for (const s of sources) {
    const k = normUrl(s.url)
    const cur = best.get(k)
    if (!cur || (CLASS_RANK[s.source_class] ?? 9) < (CLASS_RANK[cur.source_class] ?? 9)) best.set(k, s)
  }
  return [...best.values()]
}
function statusFromVotes(votes) {
  const refutes = votes.filter(v => v && v.verdict === 'refute').length
  if (refutes >= 2) return 'refuted'   // 2/3 quorum — kill
  if (refutes === 1) return 'weakened' // one dissent — narrow scope / reframe
  return 'survived'
}
function epistemicTag(sourceClass, judge, status) {
  const cls = sourceClass === 'official' || sourceClass === 'primary' ? 'primary' : 'secondary'
  const verified = judge === 'supported' ? 'verified' : 'indicative'
  return `[${cls}, ${verified}, ${status}]`
}

// ---- schemas (force structured returns; model retries on mismatch) --------

const SCOPE_SCHEMA = {
  type: 'object',
  required: ['skill_dir', 'tier', 'angles', 'recon_manifest'],
  properties: {
    skill_dir: { type: 'string', description: 'resolved absolute path to the skill install (holds scripts/ + references/)' },
    tier: { type: 'string', enum: ['fact', 'comparison', 'complex'] },
    angles: {
      type: 'array', maxItems: 20, // up to 20 search agents; no minimum — tier-driven, don't pad
      items: {
        type: 'object', required: ['key', 'question', 'source_priority'],
        properties: {
          key: { type: 'string' },
          question: { type: 'string' },
          source_priority: { type: 'string', description: 'which source class to prefer for this angle' },
        },
      },
    },
    recon_manifest: {
      type: 'array',
      items: {
        type: 'object', required: ['material', 'url', 'source_class', 'freshness', 'why'],
        properties: {
          material: { type: 'string', enum: ['yes', 'no'] },
          url: { type: 'string' },
          source_class: { type: 'string', enum: ['official', 'primary', 'authoritative-secondary', 'general'] },
          freshness: { type: 'string' },
          why: { type: 'string' },
          verdict_slot: { type: 'string', description: 'resolved at canonization (Stage 7): snapshotted:<sha8> | gap:weakened | gap:dropped; omitted/empty at scope time' },
        },
      },
    },
  },
}

const SEARCH_SCHEMA = {
  type: 'object',
  required: ['sources'],
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'object', required: ['url', 'source_class', 'claim_hint'],
        properties: {
          url: { type: 'string' },
          source_class: { type: 'string', enum: ['official', 'primary', 'authoritative-secondary', 'general'] },
          claim_hint: { type: 'string' },
        },
      },
    },
  },
}

const FETCH_SCHEMA = {
  type: 'object',
  required: ['url', 'source_class', 'dead', 'fetch_tier', 'manifest_line', 'claims'],
  properties: {
    url: { type: 'string' },
    source_class: { type: 'string', enum: ['official', 'primary', 'authoritative-secondary', 'general'], description: 'echo the source class (threaded into the epistemic tag)' },
    dead: { type: 'boolean', description: 'true if every fetch tier failed (url-dead, terminal)' },
    fetch_tier: { type: 'string', enum: ['defuddle', 'firecrawl', 'search', 'wayback', 'cache'], description: 'tier that succeeded; webfetch/websearch are NOT verbatim tiers and are barred here' },
    snapshot_sha: { type: 'string', description: 'sha256 of the cached snapshot body' },
    manifest_line: { type: 'string', description: 'TSV line printed by snapshot_manifest.py' },
    claims: {
      type: 'array',
      items: {
        type: 'object', required: ['claim_tag', 'text', 'quote', 'locator', 'load_bearing'],
        properties: {
          claim_tag: { type: 'string' },
          text: { type: 'string', description: 'the claim in your own words' },
          quote: { type: 'string', description: 'verbatim substring of the snapshot that backs it' },
          locator: { type: 'string' },
          load_bearing: { type: 'boolean' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['claim_tag', 'gate', 'reason'],
  properties: {
    claim_tag: { type: 'string' },
    gate: { type: 'string', enum: ['ok', 'flag', 'fail'], description: 'fail = deterministic gate failed (url-dead / quote not verbatim)' },
    judge: { type: 'string', enum: ['supported', 'unsupported', 'inconclusive', 'n/a'], description: 'LLM-judge on the flagged remainder only' },
    reason: { type: 'string' },
    verifier_line: { type: 'string', description: 'machine line VERIFY[<tag>]: ok|unsupported|url-dead|paywalled|inconclusive' },
  },
}

const VOTE_SCHEMA = {
  type: 'object',
  required: ['lens', 'verdict', 'evidence'],
  properties: {
    lens: { type: 'string' },
    verdict: { type: 'string', enum: ['refute', 'uphold'] },
    evidence: { type: 'string' },
    counter_url: { type: 'string', description: 'authoritative source for ¬claim, if found' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object',
  required: ['doc_path', 'verbatim_coverage', 'skill_gate_exit', 'canon_gate_exit', 'orphan_slugs', 'uncited_manifest'],
  properties: {
    doc_path: { type: 'string' },
    verbatim_coverage: { type: 'string', description: 'N/<total cited> or "K of M sampled" — never N/N passed as complete' },
    skill_gate_exit: { type: 'integer', description: 'exit of check_research_snapshots.py on the 7a [^h:sha] working form' },
    canon_gate_exit: { type: 'integer', description: 'exit of the repo canon gate on the 7b [^slug] committed form; -1 if no canonGate was provided' },
    orphan_slugs: { type: 'array', items: { type: 'string' }, description: 'slugs DEFINED in ## Источники but never cited in the body — must be empty (repo gate misses this direction)' },
    uncited_manifest: { type: 'array', items: { type: 'string' }, description: 'manifest sources (by claim_tag/sha) not cited under their own [^slug] — must be empty' },
    contradictions: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

// ===========================================================================
// STAGE -1b / 0 — Scope: autonomous source-triage + angles + effort tier.
//   Gap-driven user questions (Stage -1a) already happened pre-invocation;
//   their answers arrive as ASSUMPTIONS.
// ===========================================================================
phase('Scope')
const scope = await agent(
  `You are the lead of a disciplined research pipeline.

STEP 0 — Resolve the skill install dir (via Bash; do NOT assume a path). Probe these candidates IN ORDER and pick the first where BOTH "scripts/snapshot_manifest.py" AND "references/fetch-contract.md" exist; canonicalize the winner with \`realpath\`/\`readlink -f\` (the install is reached through a symlink). Candidates:
${SKILL_CANDIDATES.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}
  If none resolves, FAIL loudly — do not guess. Return the canonical absolute path as skill_dir.

STEP 1 — READ <skill_dir>/references/recon-protocol.md and follow it.

Question: ${QUESTION}
${ASSUMPTIONS.length ? `Derived assumptions (recorded during gap-scoping): \n- ${ASSUMPTIONS.join('\n- ')}` : 'No assumptions recorded — treat scope as given.'}

Do Stage -1b (autonomous source-triage) and Stage 0 (effort tier):
  - Triage the source landscape into a recon-manifest (material/url/source_class/freshness/why per source).
  - Decompose the question into independent search angles, each with a source_priority (official/primary > authoritative-secondary > general). Emit up to 20, no minimum — as many DISTINCT angles as the question genuinely has; do NOT pad to hit a number.
  - Pick the effort tier (it bounds how many angles to emit): fact (1-3 angles) | comparison (3-8) | complex (up to 20). Do NOT inflate.
Return only the structured object.`,
  { label: 'scope', phase: 'Scope', schema: SCOPE_SCHEMA },
)
const SKILL_DIR = scope.skill_dir // resolved once, inside the I/O layer; threaded to every downstream agent
log(`skill: ${SKILL_DIR} · tier=${scope.tier} · ${scope.angles.length} angles · ${scope.recon_manifest.length} triaged sources`)

// ===========================================================================
// STAGE 1-2 — Search: one WebSearch agent per angle (up to 20). BARRIER, because
//   the next step needs ALL candidate URLs at once to dedup globally (we must
//   snapshot each unique URL exactly once, not once per angle that found it).
//   The runtime caps concurrency at min(16, cores-2): excess angles queue and
//   drain as slots free — all still complete, just not all at the same instant.
// ===========================================================================
phase('Search')
const searches = (await parallel(scope.angles.map(a => () =>
  agent(
    `Search angle "${a.key}": ${a.question}
Source priority: ${a.source_priority}. Prefer official/primary; treat content-farm SEO as last resort.
Use WebSearch (and only WebSearch here — do NOT fetch full pages yet). Return candidate sources with the URL, your best guess at source_class, and a one-line claim_hint of what each likely supports. URLs you cannot actually find a link for do not go in the list.`,
    { label: `search:${a.key}`, phase: 'Search', schema: SEARCH_SCHEMA },
  ),
))).filter(Boolean)

const sources = dedupeByUrl(searches.flatMap(s => s.sources)) // pure JS — barrier justified
log(`${searches.length} angles searched · ${sources.length} unique sources after URL-dedup`)

// ===========================================================================
// STAGE 3-4 — Fetch-contract per UNIQUE source. All I/O lives here: the agent
//   runs the defuddle→firecrawl→search→wayback escalation, then pipes the
//   extracted body into snapshot_manifest.py (content-addressed snapshot +
//   manifest TSV line), then extracts falsifiable claims with verbatim quotes.
//   Parallel barrier so the full claim+manifest set is ready for the funnel.
// ===========================================================================
phase('Fetch')
const fetched = (await parallel(sources.map(src => () =>
  agent(
    `Fetch-contract for one source. First READ ${SKILL_DIR}/references/fetch-contract.md and follow the escalation tiers exactly. WebFetch/WebSearch are BARRED as verbatim tiers (they paraphrase) — never use them as the fetch_tier of a claim that carries a quote.

URL: ${src.url}
Likely source_class: ${src.source_class} (echo it back as source_class). Hint: ${src.claim_hint}

Steps (all via Bash):
  1. Escalate fetch: defuddle (tier 1) → firecrawl (tier 2) → search-as-discovery (tier 3) → wayback (tier 4). Record which tier succeeded as fetch_tier. If all fail → return dead=true.
  2. Snapshot the extracted body (content-addressed). The --tool you pass MUST equal your fetch_tier (manifest tool == fetch_tier — the verifier cross-checks this):
       python3 ${SKILL_DIR}/scripts/snapshot_manifest.py --claim-tag <unique-tag> --url "${src.url}" --tool <fetch_tier> --locator "<section>" --cache-dir ${CACHE_DIR} < extracted_body.md
     Capture the printed TSV line as manifest_line and the sha as snapshot_sha. Use a unique claim_tag per snapshot.
  3. Extract falsifiable claims this source supports. Each claim needs a VERBATIM substring quote from the snapshot, a locator, and load_bearing=true/false (will downstream code/decisions lean on it?). A claim found only in a search snippet (source never opened) is NOT a claim here — drop it or mark dead.
Return only the structured object.`,
    { label: `fetch:${normUrl(src.url).slice(0, 48)}`, phase: 'Fetch', schema: FETCH_SCHEMA },
  ),
))).filter(Boolean)

const manifestLines = fetched.filter(f => !f.dead && f.manifest_line).map(f => f.manifest_line)
const claims = fetched
  .filter(f => !f.dead)
  .flatMap(f => (f.claims || []).map(c => ({ ...c, url: f.url, source_class: f.source_class || 'authoritative-secondary', fetch_tier: f.fetch_tier, snapshot_sha: f.snapshot_sha })))
log(`${fetched.filter(f => f.dead).length} dead · ${manifestLines.length} snapshots · ${claims.length} claims extracted`)

// ===========================================================================
// STAGE 5-6 — Funnel + adversarial, PIPELINED per claim (no barrier): a claim
//   hits the deterministic gates the moment its source is fetched, and a
//   surviving load-bearing claim goes straight into the quorum without waiting
//   for the slowest sibling.
//     Stage A (verify): deterministic gates FIRST (url-resolve, verbatim
//       substring against <sha>.md, token co-occurrence), judge only on flag.
//     Stage B (adversarial): 3 independent skeptics, distinct lenses, mandate
//       to REFUTE. 2/3 refutes kills (refuted); 1 narrows (weakened); 0 survives.
//       Load-bearing only get the full quorum; the rest carry the verifier verdict.
// ===========================================================================
phase('Verify')
const ADVERSARY_LENSES = ['overreach: does the snapshot actually assert this, or did synthesis widen it?', 'counter-search: is there an authoritative source for the opposite?', 'freshness/supersession: has a newer official version changed this?']

const judged = await pipeline(
  claims,
  // Stage A — verification funnel (independent verifier, not the synthesizer)
  claim => agent(
    `You are an INDEPENDENT verifier (adversarial register, cheaper model is fine). First READ ${SKILL_DIR}/references/verification-funnel.md.

Claim [${claim.claim_tag}]: ${claim.text}
Quote (must be verbatim substring of the snapshot): ${JSON.stringify(claim.quote)}
Snapshot: ${CACHE_DIR}/${claim.snapshot_sha || '<sha>'}.md   ·   URL: ${claim.url}   ·   fetch_tier: ${claim.fetch_tier || '<none>'}

Run the funnel via Bash, deterministic gates FIRST (FP≈0, ~free):
  A0) fetch_tier is an OPENED verbatim tier (defuddle/firecrawl/wayback/cache). If it is webfetch/websearch or empty → gate=fail (a verbatim quote cannot come from a barred/paraphrasing tier).
  A) URL resolves (curl -sI, HTTP 200, not soft-404)
  B) quote is a verbatim substring of the snapshot file (normalize NFKC/whitespace/smart-quotes/de-hyphen)
  C) the claim's key tokens co-occur within a ±1500-char window of the quote
A hard miss on A/B → gate=fail. Cite-as-cite or a bare number/date that passes deterministically → gate=ok, judge n/a (no LLM needed). Only a paraphrase / cross-source remainder → gate=flag and run an LLM-judge faithfulness check. Emit the machine VERIFY[] line.`,
    { label: `verify:${claim.claim_tag}`, phase: 'Verify', schema: VERDICT_SCHEMA },
  ),
  // Stage B — adversarial quorum, gated on the verifier verdict
  (verdict, claim) => {
    if (!verdict || verdict.gate === 'fail') {
      return { claim, verdict, status: 'refuted', votes: [], tag: epistemicTag(claim.source_class, 'unsupported', 'refuted'), killedBy: 'deterministic-gate' }
    }
    if (!claim.load_bearing) {
      // not load-bearing → carry the verifier verdict, no quorum (sample tripwire is the skill's separate concern)
      const status = verdict.judge === 'unsupported' ? 'weakened' : 'survived'
      return { claim, verdict, status, votes: [], tag: epistemicTag(claim.source_class, verdict.judge, status) }
    }
    return parallel(ADVERSARY_LENSES.map(lens => () =>
      agent(
        `You are a red-team skeptic. First READ ${SKILL_DIR}/references/adversarial-protocol.md. Your mandate is to REFUTE this claim, not confirm it. Default to refute when uncertain.

Lens — ${lens}

Claim [${claim.claim_tag}]: ${claim.text}
Backed by: ${claim.url} (${claim.source_class}), quote ${JSON.stringify(claim.quote)}

Attack it through your lens only. If you find an authoritative ¬claim source, put its URL in counter_url. Return your single vote.`,
        { label: `refute:${claim.claim_tag}:${lens.split(':')[0]}`, phase: 'Adversarial', schema: VOTE_SCHEMA },
      ),
    )).then(votes => {
      const v = votes.filter(Boolean)
      const status = statusFromVotes(v)
      return { claim, verdict, status, votes: v, tag: epistemicTag(claim.source_class, verdict.judge, status) }
    })
  },
)

const settled = judged.filter(Boolean)
const canonized = settled.filter(j => j.status === 'survived' || j.status === 'weakened')
const refuted = settled.filter(j => j.status === 'refuted')
log(`${canonized.length} survived/weakened · ${refuted.length} refuted/killed`)

// ===========================================================================
// STAGE 7 — Canonize (verify-then-emit). Only survived/weakened enter. The
//   synthesizer assembles the 7a working form (provenance-manifest + [^h:sha]),
//   runs the snapshot/coverage gate, then emits the 7b canonical form. Gate is
//   I/O → it runs inside this agent's Bash (or the Stop hook catches it anyway).
// ===========================================================================
phase('Synthesize')
const synthInput = canonized.map(j => ({
  claim_tag: j.claim.claim_tag,
  text: j.claim.text,
  quote: j.claim.quote,
  locator: j.claim.locator,
  url: j.claim.url,
  sha: j.claim.snapshot_sha,
  status: j.status,
  epistemic_tag: j.tag,
}))
const reconManifest = scope.recon_manifest // Stage -1b triage; synth must reconcile material=yes sources against the snapshots
const snappedUrls = new Set(fetched.filter(f => !f.dead && f.snapshot_sha).map(f => normUrl(f.url)))
const reconForSynth = reconManifest.map(r => ({ ...r, _snapshotted: snappedUrls.has(normUrl(r.url)) }))
const synth = await agent(
  `You are the synthesizer. First READ ${SKILL_DIR}/references/canonical-format.md.

Question: ${QUESTION}
Canonized claims (survived/weakened only — refuted are already dropped):
${JSON.stringify(synthInput, null, 2)}

Provenance-manifest TSV lines to embed verbatim:
${manifestLines.join('\n')}

Recon-manifest (Stage -1b triage; _snapshotted = whether this URL reached a snapshot this run):
${JSON.stringify(reconForSynth, null, 2)}
${refuted.length ? `\nRefuted (reframe genuine disagreements as explicit open contradictions; never silently average):\n${refuted.map(r => `- [${r.claim.claim_tag}] ${r.claim.text}`).join('\n')}` : ''}

Two gates want OPPOSITE footnote formats — this is by design, so the stage is two-phase:
  - the skill gate wants [^h:<sha8>] (hash → snapshot); it runs on the 7a working form.
  - the repo canon gate wants the OPPOSITE: no raw [^h: survives, every ref relabeled to a human [^slug]; it runs on the committed 7b form.
One committed file cannot satisfy both. Do not try.

Do Stage 7:
  7a — Assemble the WORKING form in ${DOCS_DIR}: body with each claim footnoted [^h:<sha8>] (NOT a bare URL), a fenced \`\`\`provenance-manifest block of the TSV lines, each claim carrying its epistemic tag. Get the date with \`date +%F\` (Bash) for the frontmatter. Report verbatim coverage as N/<total cited> — never N/N as complete.
  Also emit a fenced \`\`\`recon-manifest block — one TSV line per recon source, 6 tab fields: material\\turl\\tsource_class\\tfreshness\\twhy\\tverdict_slot. RECONCILE every material=yes source: verdict_slot = snapshotted:<sha8> if _snapshotted is true (use the sha from the provenance-manifest), else gap:weakened (still relevant, unsnapshotted) or gap:dropped (discarded). A material=yes source must NEVER be silently absent or carry an empty verdict_slot — check_research_snapshots gates exactly this.
  Verify the working form via Bash → report skill_gate_exit:
     python3 ${SKILL_DIR}/scripts/check_research_snapshots.py --doc <doc> --cache-dir ${CACHE_DIR}
  COVERAGE lines are author defects to fix; DRIFT lines are advisory. Do not proceed to 7b until skill_gate_exit is 0.

  7b — Convert to the canonical form (frontmatter type/title/created/updated/status/method/beads/source_urls/tags with method: research-pipeline; relabel every [^h:<sha8>] → a stable [^slug]; add ## Источники with [^slug]: [label](url) — locator. resolved from the manifest; move method-narrative + provenance-manifest + recon-manifest into a collapsed > [!note]- Provenance callout at the end). The relabel is LOSSLESS on prose (body char-identical minus footnote markers).

  7b consistency — the [^h:sha]→[^slug] relabel must be a BIJECTION over the manifest. The repo gate only catches ONE direction (a body [^slug] with no definition); two defects slip past it, so check them yourself:
    - orphan_slugs: a [^slug] DEFINED in ## Источники but never cited in the body. Must be empty.
    - uncited_manifest: a manifest source whose snapshot is real but is not cited under its OWN slug in the body (e.g. a source cited only via a different claim's footnote). Must be empty — if a manifest source has no natural citation, cite it in the relevant paragraph or drop its manifest line. Never leave it orphaned.
  Grep both directions (every [^slug] in body ↔ every [^slug] in ## Источники ↔ every manifest line) before the gate, not after.
${CANON_GATE ? `  Then run the repo canon gate on the committed 7b form via Bash → report canon_gate_exit:
     bash ${CANON_GATE}
  This vault has no skill Stop-hook, so the committed [^slug] form must pass this gate; the [^h:sha] skill gate is already satisfied on 7a above.` : '  No repo canon gate provided (canonGate unset) → set canon_gate_exit = -1. The committed [^slug] form still must be internally consistent per the orphan/uncited checks above.'}
Return the structured result.`,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA },
)

const orphans = (synth.orphan_slugs || []).length + (synth.uncited_manifest || []).length
log(`doc: ${synth.doc_path} · verbatim ${synth.verbatim_coverage} · skill-gate ${synth.skill_gate_exit} · canon-gate ${synth.canon_gate_exit} · slug-consistency ${orphans === 0 ? 'clean' : `${orphans} DEFECTS`}`)
return {
  question: QUESTION,
  tier: scope.tier,
  sources: sources.length,
  snapshots: manifestLines.length,
  claims_total: claims.length,
  canonized: canonized.length,
  refuted: refuted.length,
  doc_path: synth.doc_path,
  verbatim_coverage: synth.verbatim_coverage,
  skill_gate_exit: synth.skill_gate_exit,
  canon_gate_exit: synth.canon_gate_exit,
  orphan_slugs: synth.orphan_slugs || [],
  uncited_manifest: synth.uncited_manifest || [],
  contradictions: synth.contradictions || [],
}
