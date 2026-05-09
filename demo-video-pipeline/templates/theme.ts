/**
 * Color tokens & font stack for overlay components.
 * Place at src/theme.ts. Adapt to match your brand.
 */
export const COLORS = {
  bg: "#0a0e1a",
  bgPanel: "rgba(15, 21, 36, 0.92)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.6)",
  accent: "#3b82f6",
  critical: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
  brand: "#60a5fa",
} as const;

export const FONT_STACK =
  '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
