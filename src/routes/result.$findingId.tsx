import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { EmptyState } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import { StaticWaveform } from "@/components/ui-kit/Waveform";
import { FindingDetail } from "@/components/diagnostics/FindingCard";
import { allMockFindings, findFinding } from "@/lib/mocks/findings";
import { shouldUseMocks } from "@/lib/api/endpoints";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/result/$findingId")({
  head: () => ({
    meta: [
      { title: "Diagnostic result — AutoAssist" },
      {
        name: "description",
        content:
          "What AutoAssist noticed in your evidence, why it matters, and the specific things to check or ask a mechanic next.",
      },
      { property: "og:title", content: "Diagnostic result — AutoAssist" },
      {
        property: "og:description",
        content: "What we noticed, why it matters, and what to check next.",
      },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { findingId } = Route.useParams();
  const navigate = useNavigate();
  const { findings, sessions } = useStore();

  const realFinding =
    findings.find((f) => f.id === findingId) ??
    sessions.flatMap((s) => s.findings).find((f) => f.id === findingId);
  const finding =
    realFinding ??
    (shouldUseMocks("image")
      ? (findFinding(findingId) ?? allMockFindings.find((f) => f.id === findingId))
      : undefined);

  if (!finding) {
    return (
      <AppShell header={<TopBar title="Result" />}>
        <EmptyState
          icon="search_off"
          title="We couldn't find that result"
          detail="It may belong to a diagnosis that was cleared. Start a new one and we'll take another look."
          actionLabel="Back to home"
          onAction={() => navigate({ to: "/home" })}
        />
      </AppShell>
    );
  }

  const isMedia = finding.kind === "audio" || finding.kind === "live";

  return (
    <AppShell header={<TopBar title="Result" subtitle={labelFor(finding.kind)} />}>
      <Page>
        {finding.kind === "image" || finding.kind === "video" || finding.kind === "dashboard" ? (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-high">
            <div className="flex h-56 items-center justify-center text-on-surface-variant">
              <Icon name={finding.kind === "video" ? "movie" : "image"} size={40} />
            </div>
            {finding.region ? (
              <span
                className="absolute rounded-xl border-2 border-tertiary bg-tertiary/12"
                style={{
                  left: `${finding.region.x}%`,
                  top: `${finding.region.y}%`,
                  width: `${finding.region.w}%`,
                  height: `${finding.region.h}%`,
                }}
              >
                <span className="absolute -top-3 left-0 rounded-full bg-tertiary px-2 py-0.5 text-caption font-semibold text-on-tertiary">
                  Area of interest
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        {isMedia ? (
          <div className="card-shadow flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="graphic_eq" size={24} filled />
            </span>
            <StaticWaveform className="flex-1" progress={0.35} />
            <span className="text-caption tabular-nums text-on-surface-variant">
              {finding.durationLabel ?? "00:00"}
            </span>
          </div>
        ) : null}

        <div className="mt-6">
          <FindingDetail finding={finding} />
        </div>

        <div className="mt-8 space-y-2">
          <PillButton icon="forum" onClick={() => navigate({ to: "/chat" })}>
            Continue the diagnosis
          </PillButton>
          <PillButton
            variant="secondary"
            icon="summarize"
            onClick={() => navigate({ to: "/summary" })}
          >
            See combined summary
          </PillButton>
          <PillButton
            variant="ghost"
            icon={isMedia ? "mic" : "photo_camera"}
            onClick={() =>
              navigate(
                isMedia
                  ? { to: "/record" }
                  : { to: "/capture", search: { mode: "engine" as const } },
              )
            }
          >
            {isMedia ? "Record again" : "Add another photo"}
          </PillButton>
        </div>
      </Page>
    </AppShell>
  );
}

function labelFor(kind: string) {
  return (
    {
      image: "Photo analysis",
      video: "Video analysis",
      audio: "Engine sound analysis",
      live: "Live listen analysis",
      dashboard: "Dashboard scan",
      chat: "Conversation",
    }[kind] ?? "Analysis"
  );
}
