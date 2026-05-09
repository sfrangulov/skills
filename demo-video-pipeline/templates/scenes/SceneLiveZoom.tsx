/**
 * SceneLiveZoom — digital zoom on a Playwright recording.
 * Place at src/scenes/SceneLiveZoom.tsx.
 *
 * Use this when the source page can't host the useZoomScenes hook
 * (staging, prod, third-party app). Zoom is applied to the recorded
 * video via transform: scale() — quality is fine up to ~2.5× on a
 * 1920p source. Past that, lossy artifacts start showing and you
 * should re-record at higher resolution instead.
 *
 * One ZoomedRecording per Sequence in your composition. The recording
 * itself is rendered inside this component (not as a global background),
 * so each scene gets its own transform.
 */
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";

type Props = {
  /** Final scale factor: 1.0 = full frame, 2.0 = 2× zoom, etc. Cap at 2.5 for sane quality. */
  scale: number;
  /** Origin x in % (0–100). Off-center origins (e.g. 17 or 90) feel cinematic. */
  ox: number;
  /** Origin y in % (0–100). */
  oy: number;
  /** Total duration of this scene in frames. Drives the easing in/out. */
  duration: number;
  /** Source mp4 in /public. Defaults to recording.mp4. */
  src?: string;
};

const EASE_FRAMES = 18; // 0.6s @ 30fps — match the in-page CSS transition

export const SceneLiveZoom: React.FC<Props> = ({
  scale,
  ox,
  oy,
  duration,
  src = "recording.mp4",
}) => {
  const frame = useCurrentFrame();

  const s = interpolate(
    frame,
    [0, EASE_FRAMES, duration - EASE_FRAMES, duration],
    [1, scale, scale, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${s})`,
          transformOrigin: `${ox}% ${oy}%`,
          willChange: "transform",
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};
