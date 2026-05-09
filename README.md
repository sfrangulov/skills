# sfrangulov/skills

A collection of agent skills installable via [skills.sh](https://skills.sh).

## Skills

- **[consulting-problem-solving](consulting-problem-solving/)** — interactive, user-led consulting framework for solving complex business problems. 8 steps from problem definition through MECE structuring, prioritization, analysis, synthesis, and final deliverables (slides or vertical document).
- **[consulting-problem-solving-ru](consulting-problem-solving-ru/)** — русскоязычная версия Consulting Problem Solving Framework. Тот же 8-шаговый процесс, переведённый на русский язык, с русскими триггер-фразами для активации.
- **[oss-product-selection](oss-product-selection/)** — structured workflow for picking the next open-source product to build when the goal is personal brand growth (not revenue). 7 phases with hard gates: constraints, asset inventory, broad ideation, competitive/platform/pain/hype scans, two-axis brand-vs-product scoring, naming, reality check and spec.
- **[demo-video-pipeline](demo-video-pipeline/)** — end-to-end automated pipeline for recording polished 30–90s demo videos of React/HTML apps. Universal zoom-hook with keyboard scenes → Playwright headless recording → Remotion overlay graphics → ElevenLabs voiceover with frame-perfect timings → final mp4 with audio. Requires Node 20+, pnpm, ffmpeg; ElevenLabs API key optional (web UI works too).

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
