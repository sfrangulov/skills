#!/usr/bin/env bash
#
# Final assembly: merge video + voiceover + (optional) music with ducking.
#
# Usage:
#   bash final-assembly.sh
#
# Or with custom paths:
#   VIDEO=out/demo.mp4 VOICE=voiceover/voice.mp3 MUSIC=voiceover/music.mp3 OUT=out/final.mp4 \
#     bash final-assembly.sh
#
set -euo pipefail

VIDEO="${VIDEO:-out/demo.mp4}"
VOICE="${VOICE:-voiceover/voice.mp3}"
MUSIC="${MUSIC:-voiceover/music.mp3}"
OUT="${OUT:-out/demo-final.mp4}"
NORMALIZE="${NORMALIZE:-1}"   # set to 0 to skip loudness normalization

# Volumes (override via env if needed)
# Music sits at 0.4 because ducking will pull it down further when the voice
# speaks; without ducking you'd want something closer to 0.15.
VOICE_VOL="${VOICE_VOL:-1.0}"
MUSIC_VOL="${MUSIC_VOL:-0.4}"

[[ -f "$VIDEO" ]] || { echo "ERROR: Missing video $VIDEO"; exit 1; }
[[ -f "$VOICE" ]] || { echo "ERROR: Missing voiceover $VOICE"; exit 1; }

mkdir -p "$(dirname "$OUT")"

if [[ -f "$MUSIC" ]]; then
  echo "→ Mixing video + voice + music with sidechain ducking..."
  # sidechaincompress takes [main][sidechain]: music is the main signal that
  # gets compressed, voice is the sidechain trigger. Reversing this would duck
  # the voice, which is the opposite of what you want.
  ffmpeg -y -i "$VIDEO" -i "$VOICE" -i "$MUSIC" \
    -filter_complex "
      [1:a]volume=${VOICE_VOL}[v];
      [2:a]volume=${MUSIC_VOL}[m];
      [m][v]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=200[ducked];
      [v][ducked]amix=inputs=2:duration=longest:dropout_transition=0[a]
    " \
    -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k \
    -shortest \
    "$OUT"
else
  echo "→ Mixing video + voice (no music)..."
  ffmpeg -y -i "$VIDEO" -i "$VOICE" \
    -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 192k \
    -shortest \
    "$OUT"
fi

if [[ "$NORMALIZE" == "1" ]]; then
  echo "→ Normalizing loudness to -14 LUFS (single-pass)..."
  TMP=$(mktemp -t final-XXXXXX).mp4
  ffmpeg -y -i "$OUT" \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
    -c:v copy -c:a aac -b:a 192k \
    "$TMP"
  mv "$TMP" "$OUT"
fi

echo ""
echo "✅ Final: $OUT"
ls -lh "$OUT"
ffprobe -v error -show_entries format=duration,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$OUT"
