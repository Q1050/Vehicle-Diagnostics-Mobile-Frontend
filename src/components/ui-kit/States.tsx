import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { PillButton } from "./PillButton";

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-manrope text-headline-md text-on-surface">{children}</h2>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={`card-shadow rounded-2xl bg-surface-container-lowest p-4 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  detail: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-surface-container-high text-primary">
        <Icon name={icon} size={30} />
      </div>
      <h3 className="mt-4 font-manrope text-headline-md text-on-surface">{title}</h3>
      <p className="mt-2 w-full max-w-[22rem] text-body-md text-on-surface-variant">{detail}</p>
      {actionLabel && onAction ? (
        <PillButton className="mt-6 w-full max-w-[22rem] text-white" onClick={onAction}>
          {actionLabel}
        </PillButton>
      ) : null}
    </div>
  );
}

export function AnalyzingState({
  title = "Analyzing your evidence",
  detail = "This usually takes a few seconds. We're comparing what you sent against known patterns.",
}: {
  title?: string | undefined;
  detail?: string | undefined;
}) {
  return (
    <div
      className="flex w-full min-w-0 flex-col items-center px-4 py-14 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex size-20 items-center justify-center">
        <span className="pulse-ring absolute inset-0 rounded-full bg-primary/25" />
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="neurology" size={26} />
        </span>
      </div>
      <h3 className="mt-5 font-manrope text-headline-md text-on-surface">{title}</h3>
      <p className="mt-2 w-full max-w-[22rem] text-body-md text-on-surface-variant">{detail}</p>
    </div>
  );
}

export function ErrorState({
  title = "We couldn't complete that",
  detail = "Something went wrong on our side. Your evidence is still saved, so you can try again.",
  onRetry,
  retryLabel = "Try again",
  secondaryLabel,
  onSecondary,
}: {
  title?: string | undefined;
  detail?: string | undefined;
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  secondaryLabel?: string | undefined;
  onSecondary?: (() => void) | undefined;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center px-4 py-12 text-center" role="alert">
      <div className="flex size-16 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <Icon name="cloud_off" size={28} />
      </div>
      <h3 className="mt-4 font-manrope text-headline-md text-on-surface">{title}</h3>
      <p className="mt-2 w-full max-w-[22rem] text-body-md text-on-surface-variant">{detail}</p>
      {onRetry ? (
        <PillButton className="mt-6 w-full max-w-[22rem] shrink-0" onClick={onRetry} icon="refresh">
          {retryLabel}
        </PillButton>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <PillButton
          variant="secondary"
          className="mt-2 w-full max-w-[22rem] shrink-0"
          onClick={onSecondary}
          icon="settings"
        >
          {secondaryLabel}
        </PillButton>
      ) : null}
    </div>
  );
}

export function InfoBanner({
  icon = "info",
  tone = "neutral",
  children,
}: {
  icon?: string | undefined;
  tone?: "neutral" | "warning" | "safety" | undefined;
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-surface-container-high text-on-surface-variant",
    warning: "bg-warning-container text-on-warning-container",
    safety: "bg-tertiary-container text-on-tertiary-container",
  } as const;
  return (
    <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-label-md ${tones[tone]}`}>
      <Icon name={icon} size={20} className="mt-0.5 shrink-0" filled />
      <p className="font-normal leading-5">{children}</p>
    </div>
  );
}
