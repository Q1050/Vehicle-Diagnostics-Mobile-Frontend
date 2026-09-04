import type { ConcernLevel, ConfidenceLevel, EvidenceKind, SupportLevel } from "../../types";

export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function mapConfidence(value: number): ConfidenceLevel {
  const normalized = clampUnit(value);
  if (normalized >= 0.75) return "high";
  if (normalized >= 0.45) return "moderate";
  return "low";
}

export function mapConcern(value: number): ConcernLevel {
  const normalized = clampUnit(value);
  if (normalized >= 0.85) return "urgent";
  if (normalized >= 0.55) return "inspect";
  if (normalized >= 0.25) return "monitor";
  return "informational";
}

export function mapSupport(value: number): SupportLevel {
  const normalized = clampUnit(value);
  if (normalized >= 0.7) return "strong";
  if (normalized >= 0.4) return "moderate";
  return "limited";
}

export function humanize(value: string): string {
  const text = value.replace(/^possible_/, "Possible ").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function evidenceKind(source: string): EvidenceKind {
  if (["image", "audio", "video", "dashboard", "live", "chat"].includes(source)) {
    return source as EvidenceKind;
  }
  return "chat";
}
