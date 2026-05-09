/**
 * Remotion configuration. Place at project root as remotion.config.ts.
 */
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4); // parallel frame render. Bump to 8 on M-series Macs.

// Quality knobs (optional):
// Config.setCrf(18);              // visually lossless
// Config.setCodec("h264-mkv");    // faster than mp4 if you don't need browser playback directly
