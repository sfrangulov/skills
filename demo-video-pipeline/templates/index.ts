/**
 * Remotion entry point. Place at src/index.ts.
 *
 * `remotion studio` and `remotion render` both load this file. It registers
 * the Root component which lists every <Composition> the project exposes.
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
