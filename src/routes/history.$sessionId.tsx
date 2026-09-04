import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { EmptyState, InfoBanner } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import { SupportBadge, concernBorder } from "@/components/ui-kit/Badges";
import { FindingSummaryCard } from "@/components/diagnostics/FindingCard";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useStore } from "@/state/store";
import { vehicleLabel } from "@/lib/mocks/vehicles";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSession } from "@/lib/api/history";
import { loadConversation } from "@/lib/api/conversations";

export const Route = createFileRoute("/history/$sessionId")({
  head: () => ({
    meta: [
      { title: "Past diagnosis — AutoAssist" },
      {
        name: "description",
        content:
          "The full record of a past AutoAssist diagnosis: the conversation, the evidence you shared, the leading theory and what was recommended.",
      },
      { property: "og:title", content: "Past diagnosis — AutoAssist" },
      {
        property: "og:description",
        content: "The conversation, the evidence and what was recommended.",
      },
    ],
  }),
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { sessions, vehicles, startNewDiagnosis } = useStore();
  const cached = sessions.find((s) => s.id === sessionId);
  const {
    data: session,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["diagnostic-session", sessionId],
    queryFn: async () => {
      const loaded = await getSession(sessionId);
      return loaded.conversationId
        ? { ...loaded, messages: await loadConversation(loaded.conversationId) }
        : loaded;
    },
    ...(cached ? { placeholderData: cached } : {}),
  });

  if (isLoading && !session) {
    return (
      <AppShell header={<TopBar title="Diagnosis" />}>
        <div className="p-6 text-center text-on-surface-variant" role="status">
          Loading saved diagnosis…
        </div>
      </AppShell>
    );
  }
  if (isError) {
    return (
      <AppShell header={<TopBar title="Diagnosis" />}>
        <EmptyState
          icon="cloud_off"
          title="We couldn't load that diagnosis"
          detail="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell header={<TopBar title="Diagnosis" />}>
        <EmptyState
          icon="search_off"
          title="That diagnosis isn't here"
          detail="It may have been removed from this device. Your other diagnoses are still in history."
          actionLabel="Back to history"
          onAction={() => navigate({ to: "/history" })}
        />
      </AppShell>
    );
  }

  const vehicle = vehicles.find((v) => v.id === session.vehicleId);
  const leading = session.fusion?.hypotheses[0];

  return (
    <AppShell
      header={
        <TopBar
          title={session.headline}
          subtitle={`${formatDate(session.date)} · ${vehicle ? vehicleLabel(vehicle) : "Vehicle removed"}`}
        />
      }
    >
      <Page>
        <InfoBanner icon="history">
          Saved diagnosis. Nothing here has changed since {formatDate(session.date)}.
        </InfoBanner>

        <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
          <p className="text-caption font-semibold tracking-wide text-primary uppercase">
            What you reported
          </p>
          <p className="mt-1 text-body-md text-on-surface">“{session.complaint}”</p>
        </div>

        {leading ? (
          <div
            className={`card-shadow mt-5 rounded-2xl border-l-4 bg-surface-container-lowest p-5 ${concernBorder[leading.concern]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-manrope text-headline-md text-on-surface">{leading.title}</h2>
            </div>
            <div className="mt-2">
              <SupportBadge level={leading.support} />
            </div>
            <p className="mt-3 text-body-md text-on-surface-variant">{leading.rationale}</p>
          </div>
        ) : null}

        {session.findings.length ? (
          <section className="mt-7">
            <h3 className="mb-3 font-manrope text-headline-md text-on-surface">
              Evidence collected
            </h3>
            <div className="space-y-3">
              {session.findings.map((f) => (
                <FindingSummaryCard key={f.id} finding={f} />
              ))}
            </div>
          </section>
        ) : null}

        {session.recommendations.length ? (
          <section className="mt-7">
            <h3 className="mb-3 font-manrope text-headline-md text-on-surface">
              What was recommended
            </h3>
            <ul className="space-y-2">
              {session.recommendations.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-label-md font-normal text-on-surface-variant"
                >
                  <Icon name="check_circle" size={18} filled className="mt-0.5 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {session.messages.length ? (
          <section className="mt-7">
            <h3 className="mb-3 font-manrope text-headline-md text-on-surface">Conversation</h3>
            <div className="space-y-3">
              {session.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  finding={session.findings.find((f) => f.id === m.findingId)}
                  onOpenFinding={(f) =>
                    navigate({ to: "/result/$findingId", params: { findingId: f.id } })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <PillButton
          className="mt-8"
          icon="forum"
          onClick={() =>
            void startNewDiagnosis()
              .then(() => navigate({ to: "/chat" }))
              .catch((error) =>
                toast.error(
                  error instanceof Error ? error.message : "We couldn't start a diagnosis.",
                ),
              )
          }
        >
          Start a new diagnosis
        </PillButton>
      </Page>
    </AppShell>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
