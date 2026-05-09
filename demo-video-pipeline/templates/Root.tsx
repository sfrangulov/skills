/**
 * Remotion composition registry. Place at src/Root.tsx.
 *
 * The composition's true duration comes from public/markers.json
 * (written by scripts/record-demo.ts). calculateMetadata reads it
 * and overrides the placeholder durationInFrames below — so when
 * you re-record, the composition automatically resizes. No manual
 * sync between recorder and composition.
 *
 * See companion skill remotion-best-practices, rule
 * `calculate-metadata.md`, for the full pattern.
 */
import { Composition, type CalculateMetadataFunction } from "remotion";
import { DemoComposition } from "./DemoComposition";
import markers from "../public/markers.json";

const FPS = markers.fps ?? 30;

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const visibleDurationMs = markers.totalDurationMs - markers.headTrimMs;
  return {
    durationInFrames: Math.ceil((visibleDurationMs / 1000) * FPS),
    fps: FPS,
  };
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="DemoV1"
      component={DemoComposition}
      // Placeholder — overridden by calculateMetadata above.
      durationInFrames={1}
      fps={FPS}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata}
    />
  );
};
