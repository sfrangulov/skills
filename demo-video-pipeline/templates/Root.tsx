/**
 * Remotion composition registry. Place at src/Root.tsx.
 */
import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";

const FPS = 30;
const DURATION_SECONDS = 60;

export const RemotionRoot = () => {
  return (
    <Composition
      id="DemoV1"
      component={DemoComposition}
      durationInFrames={DURATION_SECONDS * FPS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
