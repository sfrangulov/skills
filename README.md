# sfrangulov/skills

A collection of agent skills installable via [skills.sh](https://skills.sh).

## Skills

- **[consulting-problem-solving](consulting-problem-solving/)** — interactive, user-led consulting framework for solving complex business problems. 8 steps from problem definition through MECE structuring, prioritization, analysis, synthesis, and final deliverables (slides or vertical document).
- **[consulting-problem-solving-ru](consulting-problem-solving-ru/)** — русскоязычная версия Consulting Problem Solving Framework. Тот же 8-шаговый процесс, переведённый на русский язык, с русскими триггер-фразами для активации.
- **[oss-product-selection](oss-product-selection/)** — structured workflow for picking the next open-source product to build when the goal is personal brand growth (not revenue). 7 phases with hard gates: constraints, asset inventory, broad ideation, competitive/platform/pain/hype scans, two-axis brand-vs-product scoring, naming, reality check and spec.
- **[demo-video-pipeline](demo-video-pipeline/)** — end-to-end automated pipeline for recording polished 30–90s demo videos of React/HTML apps. Universal zoom-hook with keyboard scenes → Playwright headless recording → Remotion overlay graphics → ElevenLabs voiceover with frame-perfect timings → final mp4 with audio. Requires Node 20+, pnpm, ffmpeg; ElevenLabs API key optional (web UI works too).
- **[research-pipeline](research-pipeline/)** — disciplined multi-source research pipeline producing a verifiable, snapshot-backed document. Orchestrated subagents with structured specs, source-discipline, a fetch-escalation contract, a deterministic→judge verification funnel, content-addressed snapshots + provenance manifest, and a mandatory adversarial pass. Bundled Python tools, no API keys. Explicit-invocation only.
- **[book-to-skills](book-to-skills/)** — distill a book, long-video transcript, podcast, or course into a set of atomic, executable agent skills. RIA-TV++ pipeline: Adler whole-work pass → 5 parallel extractors → triple verification → RIA++ skill construction → Zettelkasten linking → pressure testing with bait prompts → reader-facing digest. Ships with a starter corpus of legally free books. English adaptation of [cangjie-skill](https://github.com/kangarooking/cangjie-skill) (MIT).

## Install

Install a single skill:

```bash
npx skills add sfrangulov/skills --skill consulting-problem-solving
```

Install the Russian version:

```bash
npx skills add sfrangulov/skills --skill consulting-problem-solving-ru
```

Install all skills from this repo:

```bash
npx skills add sfrangulov/skills --skill '*'
```

Install several at once:

```bash
npx skills add sfrangulov/skills --skill consulting-problem-solving --skill another-skill
```

## License

MIT — see [LICENSE](LICENSE).
