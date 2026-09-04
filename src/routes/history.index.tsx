import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { AnalyzingState, EmptyState, ErrorState } from "@/components/ui-kit/States";
import { evidenceIcon } from "@/components/ui-kit/Badges";
import { PillButton } from "@/components/ui-kit/PillButton";
import { useStore } from "@/state/store";
import { vehicleLabel } from "@/lib/mocks/vehicles";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSessions } from "@/lib/api/history";
import { toast } from "sonner";

export const Route = createFileRoute("/history/")({
  head: () => ({
    meta: [
      { title: "Diagnostic history — AutoAssist" },
      {
        name: "description",
        content:
          "Every diagnosis you've run with AutoAssist, with the evidence you shared and what it pointed to, ready to revisit or show a mechanic.",
      },
      { property: "og:title", content: "Diagnostic history — AutoAssist" },
      {
        property: "og:description",
        content: "Revisit past diagnoses and the evidence behind them.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const { vehicles, dispatch, startNewDiagnosis } = useStore();
  const [starting, setStarting] = useState(false);
  const {
    data: sessions = [],
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ["diagnostic-sessions"],
    queryFn: listSessions,
    refetchOnMount: "always",
  });

  async function startFreshDiagnosis() {
    if (starting) return;
    setStarting(true);
    try {
      await startNewDiagnosis();
      navigate({ to: "/chat" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't start a diagnosis.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (isSuccess) dispatch({ type: "setSessions", sessions });
  }, [isSuccess, sessions, dispatch]);

  if (isLoading) {
    return (
      <AppShell nav>
        <AnalyzingState title="Loading history" detail="Retrieving your saved diagnoses…" />
      </AppShell>
    );
  }
  if (isError) {
    return (
      <AppShell nav>
        <ErrorState title="We couldn't load your history" onRetry={() => void refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell nav>
      <Page className="pt-6">
        <h1 className="font-manrope text-headline-lg text-on-surface">Diagnostic history</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Past checks stay here so you can compare, or show them to a mechanic.
        </p>
        {sessions.length > 0 ? (
          <PillButton className="mt-4" icon="add" onClick={startFreshDiagnosis} disabled={starting}>
            {starting ? "Starting diagnosis…" : "Start new diagnosis"}
          </PillButton>
        ) : null}

        {sessions.length === 0 ? (
          <EmptyState
            icon="history"
            title="No diagnoses yet"
            detail="Once you describe a problem and share a photo or recording, the summary lands here."
            actionLabel="Start a diagnosis"
            onAction={startFreshDiagnosis}
          />
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({ to: "/history/$sessionId", params: { sessionId: s.id } })
                    }
                    className="card-shadow w-full rounded-2xl bg-surface-container-lowest p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon name="assignment" size={22} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h2 className="truncate font-manrope text-body-lg font-bold text-on-surface">
                            {s.headline}
                          </h2>
                          <span className="shrink-0 text-caption font-normal text-on-surface-variant">
                            {formatDate(s.date)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-label-md font-normal text-on-surface-variant">
                          {vehicle ? vehicleLabel(vehicle) : "Vehicle removed"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-label-md font-normal text-on-surface-variant">
                          {s.preview ?? s.complaint}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {s.evidenceKinds.map((k) => (
                            <span
                              key={k}
                              title={k}
                              className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant"
                            >
                              <Icon name={evidenceIcon[k] ?? "insights"} size={15} />
                            </span>
                          ))}
                        </div>
                      </div>
                      <Icon
                        name="chevron_right"
                        size={20}
                        className="mt-2 text-on-surface-variant"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Page>
    </AppShell>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
