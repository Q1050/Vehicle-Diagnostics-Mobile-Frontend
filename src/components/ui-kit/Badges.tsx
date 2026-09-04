import type { ConcernLevel, ConfidenceLevel, SupportLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

const chip = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold";

const confidenceStyles: Record<ConfidenceLevel, { label: string; cls: string; icon: string }> = {
  high: {
    label: "High confidence",
    cls: "bg-success-container text-on-success-container",
    icon: "verified",
  },
  moderate: {
    label: "Moderate confidence",
    cls: "bg-warning-container text-on-warning-container",
    icon: "help",
  },
  low: {
    label: "Low confidence",
    cls: "bg-surface-container-high text-on-surface-variant",
    icon: "help",
  },
};

export function ConfidenceBadge({
  level,
  className,
}: {
  level: ConfidenceLevel;
  className?: string | undefined;
}) {
  const s = confidenceStyles[level];
  return (
    <span className={cn(chip, s.cls, className)}>
      <Icon name={s.icon} size={14} filled />
      {s.label}
    </span>
  );
}

const concernStyles: Record<ConcernLevel, { label: string; cls: string; icon: string }> = {
  informational: {
    label: "For your information",
    cls: "bg-surface-container-high text-on-surface-variant",
    icon: "info",
  },
  monitor: {
    label: "Worth monitoring",
    cls: "bg-warning-container text-on-warning-container",
    icon: "visibility",
  },
  inspect: {
    label: "Have it inspected",
    cls: "bg-tertiary-container text-on-tertiary-container",
    icon: "build",
  },
  urgent: {
    label: "Don't delay this",
    cls: "bg-error-container text-on-error-container",
    icon: "priority_high",
  },
};

export function ConcernBadge({
  level,
  className,
}: {
  level: ConcernLevel;
  className?: string | undefined;
}) {
  const s = concernStyles[level];
  return (
    <span className={cn(chip, s.cls, className)}>
      <Icon name={s.icon} size={14} filled />
      {s.label}
    </span>
  );
}

/** 4px severity border colour used on diagnostic cards (per DESIGN.md). */
export const concernBorder: Record<ConcernLevel, string> = {
  informational: "border-l-outline-variant",
  monitor: "border-l-warning",
  inspect: "border-l-tertiary",
  urgent: "border-l-error",
};

const supportStyles: Record<SupportLevel, { label: string; cls: string }> = {
  strong: { label: "Strongly supported", cls: "bg-success-container text-on-success-container" },
  moderate: { label: "Some support", cls: "bg-warning-container text-on-warning-container" },
  limited: { label: "Limited support", cls: "bg-surface-container-high text-on-surface-variant" },
};

export function SupportBadge({ level, className }: { level: SupportLevel; className?: string }) {
  const s = supportStyles[level];
  return <span className={cn(chip, s.cls, className)}>{s.label}</span>;
}

export const evidenceIcon: Record<string, string> = {
  chat: "forum",
  image: "photo_camera",
  audio: "graphic_eq",
  video: "videocam",
  dashboard: "dashboard",
  live: "hearing",
};
