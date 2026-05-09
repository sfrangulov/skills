---
name: 06-final-assembly
description: Final ffmpeg assembly — video + voiceover + music with ducking, loudness normalization, export
---

# Final assembly

## What we have

At this point:
- `out/demo.mp4` — video without audio (from phase 4 Remotion)
- `voiceover/voice.mp3` — voiceover (from phase 5)
- `voiceover/music.mp3` — background music (optional)

Goal: `out/demo-final.mp4` — final mp4 with audio.

## Basic mix (voiceover only)

```bash
ffmpeg -i out/demo.mp4 -i voiceover/voice.mp3 \
  -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k \
  -shortest \
  out/demo-final.mp4
```

- `-map 0:v` — take video from the first input
- `-map 1:a` — audio from the second
- `-c:v copy` — don't re-encode video (fast, lossless)
- `-c:a aac -b:a 192k` — convert mp3 → AAC 192 kbps (universal)
- `-shortest` — trim to the length of the shortest stream

## With music and ducking

Ducking = automatically lowering the music when the voiceover speaks. Standard for professional video.

**Important:** `sidechaincompress` takes inputs as `[main][sidechain]`. The **main** input is the signal that gets compressed (music), and the **sidechain** is the trigger (voice). Get the order wrong and you'll duck the voice instead of the music.

```bash
ffmpeg -i out/demo.mp4 -i voiceover/voice.mp3 -i voiceover/music.mp3 \
  -filter_complex "
    [1:a]volume=1.0[voice];
    [2:a]volume=0.4[music];
    [music][voice]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=200[ducked];
    [voice][ducked]amix=inputs=2:duration=longest:dropout_transition=0[mixed]
  " \
  -map 0:v -map "[mixed]" \
  -c:v copy -c:a aac -b:a 192k \
  -shortest \
  out/demo-final.mp4
```

`sidechaincompress` parameters:
- `threshold=0.05` — when the voice gets louder than this, ducking kicks in
- `ratio=8` — how hard the music is compressed (8:1 is heavy)
- `attack=5` — reaction time in ms (5ms is fast)
- `release=200` — recovery time in ms (200ms is a soft fade-up after a pause)

Why `volume=0.4` on music instead of the very low `0.15` you'd use without ducking: with proper ducking the music can sit at a more present level when the voice isn't speaking, and still get pulled way down during dialogue. The result feels professional rather than buried.

**Simple variant without ducking** (a flat static mix):
```bash
ffmpeg -i out/demo.mp4 -i voiceover/voice.mp3 -i voiceover/music.mp3 \
  -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.15[m];[v][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac -b:a 192k \
  -shortest \
  out/demo-final.mp4
```

## Loudness normalization (optional, recommended)

YouTube / LinkedIn normalize audio to EBU R128 = **−14 LUFS**. If your voice is at −8 LUFS, the platform will turn it down → uneven volume across the playlist.

Two-pass loudness normalization:
```bash
# Pass 1: measure
ffmpeg -i out/demo-final.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null -

# Read from the JSON: input_i, input_tp, input_lra, input_thresh, target_offset
# Pass 2: apply
ffmpeg -i out/demo-final.mp4 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=<input_i>:measured_TP=<input_tp>:measured_LRA=<input_lra>:measured_thresh=<input_thresh>:offset=<target_offset>" \
  -c:v copy -c:a aac -b:a 192k \
  out/demo-final-loud.mp4
```

Single-pass (faster, slightly less accurate):
```bash
ffmpeg -i out/demo-final.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 \
  -c:v copy -c:a aac -b:a 192k \
  out/demo-final-loud.mp4
```

## final-assembly.sh script

See the full script in [templates/final-assembly.sh](../templates/final-assembly.sh) — a wrapper with file checks and clear variables.

```bash
#!/usr/bin/env bash
set -euo pipefail

VIDEO="${VIDEO:-out/demo.mp4}"
VOICE="${VOICE:-voiceover/voice.mp3}"
MUSIC="${MUSIC:-voiceover/music.mp3}"
OUT="${OUT:-out/demo-final.mp4}"

[[ -f "$VIDEO" ]] || { echo "Missing $VIDEO"; exit 1; }
[[ -f "$VOICE" ]] || { echo "Missing $VOICE"; exit 1; }

if [[ -f "$MUSIC" ]]; then
  echo "→ Mixing video + voice + music with ducking"
  ffmpeg -y -i "$VIDEO" -i "$VOICE" -i "$MUSIC" \
    -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.4[m];[m][v]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=200[ducked];[v][ducked]amix=inputs=2:duration=longest:dropout_transition=0[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
else
  echo "→ Mixing video + voice (no music)"
  ffmpeg -y -i "$VIDEO" -i "$VOICE" \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
fi

echo "✅ $OUT"
ls -lh "$OUT"
```

## Where to get music

**Free royalty-free** (commercial use OK):
- https://freepd.com — public domain, instant
- https://www.bensound.com — free tier requires attribution
- https://incompetech.com (Kevin MacLeod) — huge library, CC-BY
- YouTube Audio Library — https://studio.youtube.com → audio library, free even for production use

**Paid premium:**
- Artlist ($15/mo) — best for marketing video
- Epidemic Sound ($15/mo) — large catalog, production grade
- Soundstripe ($16/mo)

**Genres for demo video:**
- "Cinematic ambient" / "Tense uplifting" — for presidential demos
- "Corporate inspiring" — for marketing
- "Tech glitch" / "Minimal electronic" — for product demos
- "Documentary score" — for longer case studies

## Final formats per platform

| Platform | Resolution | Aspect | Bitrate | Length |
|---|---|---|---|---|
| LinkedIn | 1920×1080 | 16:9 | 5–10 Mbps | up to 10 min |
| YouTube | 1920×1080 / 4K | 16:9 | 8–12 Mbps | unlimited |
| LinkedIn (mobile feed) | 1080×1080 | 1:1 | 5 Mbps | ≤30s ideal |
| Twitter/X | 1280×720 / 1920×1080 | 16:9 | 5 Mbps | up to 2:20 |
| Instagram Reels | 1080×1920 | 9:16 | 5 Mbps | up to 90s |

For **9:16 portrait** (Reels / TikTok) — re-render the Composition with a different viewport (1080×1920) and a different SCENES (more aggressive zoom, since the frame is narrow).

## Pitfalls

### Audio is 1–2 frames late or early

Sync drift between mp4 and mp3. Fix: `-async 1` makes ffmpeg resample the audio to fit the video time base:
```bash
ffmpeg -i video.mp4 -i voice.mp3 -map 0:v -map 1:a -async 1 -c:v copy -c:a aac out.mp4
```

### Music gets cut to the voiceover length

If the voiceover is 55s and the music is 3 minutes, `-shortest` takes the min. Fix: trim the music in advance, or use `duration=longest` in `amix`.

### Final mp4 won't play in QuickTime

Check:
- `-pix_fmt yuv420p` (not yuv444p)
- `-movflags +faststart`
- `-c:v libx264 -profile:v high -level 4.0` for compatibility

### File too large

Parameters to reduce size:
- `-crf 23` instead of 18 (was visually lossless, now just "good")
- `-preset slower` — better compression at the same CRF
- `-b:a 128k` instead of 192k for audio

## Pre-publish checks

1. **Audio level** — open in QuickTime, listen — voice clearly audible, music doesn't fight it
2. **Lip-sync / overlay sync** — Remotion overlays land on the right voiceover beats
3. **Duration** — clean number (not 60.6s, but 60.0s — trim with `-t 60`)
4. **Mobile playback** — open the mp4 on a phone — does it play at all? (codec compatibility)
5. **Metadata** — `ffprobe out/demo-final.mp4` — verify codec/bitrate/duration
