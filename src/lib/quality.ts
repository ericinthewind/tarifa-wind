import type { SessionQuality } from "./types";

const LEGACY_LABELS = new Set(["Possible", "Marginal"]);

export function qualityLabel(quality: string): SessionQuality | string {
  if (LEGACY_LABELS.has(quality) || quality === "Worth it") return "Better than Zoom";
  if (quality === "Excellent") return "Send it";
  if (quality === "Good") return "Solid send";
  return quality;
}

export function qualityClass(quality: string): string {
  if (LEGACY_LABELS.has(quality) || quality === "Worth it") return "worth-it";
  if (quality === "Excellent") return "excellent";
  if (quality === "Good") return "good";
  return quality.toLowerCase();
}
