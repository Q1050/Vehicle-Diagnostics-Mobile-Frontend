import type { AnalysisFinding } from "@/lib/types";
import { ConcernBadge, ConfidenceBadge, concernBorder, evidenceIcon } from "../ui-kit/Badges";
import { Icon } from "../ui-kit/Icon";
import { cn } from "@/lib/utils";

/** Compact result card, used inline in chat and in history. */
export function FindingSummaryCard({
  finding,
  onOpen,
  className,
}: {
  finding: AnalysisFinding;
  onOpen?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "card-shadow w-full rounded-2xl border-l-4 bg-surface-container-lowest p-4 text-left",
        concernBorder[finding.concern],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
          <Icon name={evidenceIcon[finding.kind] ?? "insights"} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-manrope text-body-md font-bold text-on-surface">{finding.title}</h3>
          {finding.area ? (
            <p className="text-caption font-normal text-on-surface-variant">{finding.area}</p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-label-md font-normal text-on-surface-variant">
            {finding.whatWeNoticed}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConfidenceBadge level={finding.confidence} />
            <ConcernBadge level={finding.concern} />
          </div>
        </div>
        {onOpen ? (
          <Icon name="chevron_right" size={20} className="mt-1 text-on-surface-variant" />
        ) : null}
      </div>
    </button>
  );
}

/** Full detail body shared by every result screen. */
export function FindingDetail({ finding }: { finding: AnalysisFinding }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge level={finding.confidence} />
          <ConcernBadge level={finding.concern} />
        </div>
        <h2 className="mt-3 font-manrope text-headline-lg text-on-surface">{finding.title}</h2>
        {finding.area ? (
          <p className="mt-1 text-label-md font-normal text-on-surface-variant">{finding.area}</p>
        ) : null}
      </div>

      {finding.explanationUnavailable ? (
        <div className="rounded-2xl bg-warning-container px-4 py-3 text-label-md font-normal text-on-warning-container">
          We could analyse your evidence, but the written explanation isn't available right now. The
          observation below still stands.
        </div>
      ) : null}

      <Section icon="visibility" title="What we noticed">
        {finding.whatWeNoticed}
      </Section>

      <Section icon="help" title="Why it matters">
        {finding.whyItMatters}
      </Section>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-manrope text-body-md font-bold text-on-surface">
          <Icon name="checklist" size={18} className="text-primary" />
          What to do next
        </h3>
        <ul className="space-y-2">
          {finding.nextSteps.map((step) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-label-md font-normal text-on-surface-variant"
            >
              <Icon name="arrow_forward" size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-caption font-normal text-on-surface-variant">
        AutoAssist points you in the right direction using the evidence you shared. It doesn't
        replace a hands-on inspection by a qualified mechanic.
      </p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 font-manrope text-body-md font-bold text-on-surface">
        <Icon name={icon} size={18} className="text-primary" />
        {title}
      </h3>
      <p className="text-body-md text-on-surface-variant">{children}</p>
    </div>
  );
}
