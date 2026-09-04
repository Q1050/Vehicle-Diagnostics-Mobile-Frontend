import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { AnalyzingState, EmptyState, ErrorState, InfoBanner } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import {
  ConcernBadge,
  SupportBadge,
  concernBorder,
  evidenceIcon,
} from "@/components/ui-kit/Badges";
import { fuseEvidence } from "@/lib/api/diagnostics";
import { useStore } from "@/state/store";
import type { DiagnosticSession } from "@/lib/types";
import { getSession, saveSession as persistSession } from "@/lib/api/history";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { summarizeConversation } from "@/lib/conversationSummary";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Diagnostic summary — AutoAssist" },
      {
        name: "description",
        content:
          "AutoAssist combines your description, photos, recordings and video into one picture: the leading theory, the evidence behind it, and the alternatives.",
      },
      { property: "og:title", content: "Diagnostic summary — AutoAssist" },
      {
        property: "og:description",
        content: "One combined picture of the evidence, plus the alternatives worth keeping open.",
      },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { findings, fusion, dispatch, currentVehicle, messages, sessions, activeSession } =
    useStore();
  const [phase, setPhase] = useState<"idle" | "loading" | "error">(fusion ? "idle" : "loading");
  const [saving, setSaving] = useState(false);
  const serverSession = useQuery({
    queryKey: ["diagnostic-session", activeSession.id],
    queryFn: () => getSession(activeSession.id),
    enabled: !activeSession.id.startsWith("active_"),
  });
  const report = summarizeConversation(serverSession.data?.conversationState, messages);
  const manualReferences = Array.from(
    new Map(
      messages
        .flatMap((message) => message.citations ?? [])
        .map((citation) => [
          `${citation.documentId}-${citation.page}-${citation.section ?? ""}`,
          citation,
        ]),
    ).values(),
  );

  useEffect(() => {
    if (fusion || findings.length === 0) {
      setPhase("idle");
      return;
    }
    let cancelled = false;
    setPhase("loading");
    fuseEvidence(findings, activeSession.artifacts, {
      sessionId: activeSession.id,
      ...(currentVehicle ? { vehicleId: currentVehicle.id } : {}),
    })
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "setFusion", fusion: res });
          setPhase("idle");
        }
      })
      .catch(() => !cancelled && setPhase("error"));
    return () => {
      cancelled = true;
    };
  }, [fusion, findings, activeSession.artifacts, activeSession.id, currentVehicle?.id, dispatch]);

  const leading = fusion?.hypotheses[0];
  const alternates = fusion?.hypotheses.slice(1) ?? [];

  async function save() {
    if (saving) return;
    setSaving(true);
    const session: DiagnosticSession = {
      id: activeSession.id,
      conversationId: activeSession.conversationId,
      vehicleId: currentVehicle?.id ?? "unknown",
      date: new Date().toISOString().slice(0, 10),
      complaint:
        messages.find((m) => m.role === "user" && m.text)?.text ?? "Diagnosis from evidence",
      headline: leading?.title ?? "Diagnostic summary",
      evidenceKinds: Array.from(new Set(findings.map((f) => f.kind))),
      messages,
      findings,
      ...(fusion ? { fusion } : {}),
      recommendations:
        findings.flatMap((f) => f.nextSteps).slice(0, 4).length > 0
          ? findings.flatMap((f) => f.nextSteps).slice(0, 4)
          : [report.nextStep],
    };
    try {
      const saved = await persistSession(session);
      dispatch({ type: "saveSession", session: saved });
      queryClient.setQueryData<DiagnosticSession[]>(["diagnostic-sessions"], (current = []) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      await queryClient.invalidateQueries({ queryKey: ["diagnostic-sessions"] });
      dispatch({ type: "resetConversation" });
      toast.success("Saved to your diagnostic history.");
      navigate({ to: "/history/$sessionId", params: { sessionId: saved.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't save this diagnosis.");
    } finally {
      setSaving(false);
    }
  }

  if (findings.length === 0 && serverSession.isLoading && !report.hasReports) {
    return (
      <AppShell header={<TopBar title="Summary" />} nav>
        <AnalyzingState title="Loading summary" detail="Retrieving what you reported…" />
      </AppShell>
    );
  }

  if (findings.length === 0 && !report.hasReports && manualReferences.length === 0) {
    return (
      <AppShell header={<TopBar title="Summary" />} nav>
        <EmptyState
          icon="summarize"
          title="Nothing to combine yet"
          detail="Add a photo, an engine recording or a video and AutoAssist can weigh the evidence together."
          actionLabel="Start a diagnosis"
          onAction={() => navigate({ to: "/chat" })}
        />
      </AppShell>
    );
  }

  if (findings.length === 0) {
    return (
      <AppShell header={<TopBar title="Diagnostic summary" />}>
        <Page>
          <SummarySection title="Reported symptoms" icon="chat">
            {report.reported}
          </SummarySection>
          <SummarySection title="Measured evidence" icon="analytics">
            No audio, image, or video diagnostic evidence has been collected yet.
          </SummarySection>
          <SummarySection title="Current assessment" icon="neurology">
            {report.assessment}
          </SummarySection>
          <SummarySection title="Recommended next step" icon="arrow_forward">
            {report.nextStep}
          </SummarySection>
          {manualReferences.length ? (
            <SummarySection title="Manufacturer guidance / Manual reference" icon="menu_book">
              {manualReferences.map((citation) => (
                <span
                  key={`${citation.documentId}-${citation.page}-${citation.section ?? ""}`}
                  className="block"
                >
                  {citation.manualTitle}, page {citation.page}
                  {citation.section ? ` — ${citation.section}` : ""}
                </span>
              ))}
            </SummarySection>
          ) : null}
          <div className="mt-8 space-y-2">
            <PillButton icon="bookmark" onClick={save} disabled={saving}>
              {saving ? "Saving diagnosis…" : "Save to history"}
            </PillButton>
            <PillButton variant="secondary" icon="forum" onClick={() => navigate({ to: "/chat" })}>
              Add measured evidence
            </PillButton>
          </div>
        </Page>
      </AppShell>
    );
  }

  if (phase === "loading") {
    return (
      <AppShell header={<TopBar title="Summary" showBack={false} />}>
        <AnalyzingState
          title="Combining your evidence"
          detail="We're checking where your description, photos and recordings agree — and where they don't."
        />
      </AppShell>
    );
  }

  if (phase === "error" || !fusion) {
    return (
      <AppShell header={<TopBar title="Summary" />}>
        <ErrorState
          title="We couldn't combine the evidence"
          onRetry={() => dispatch({ type: "setFusion", fusion: null })}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <TopBar title="Diagnostic summary" subtitle={`${findings.length} pieces of evidence`} />
      }
    >
      <Page>
        {report.hasReports ? (
          <SummarySection title="Reported symptoms" icon="chat">
            {report.reported}
          </SummarySection>
        ) : null}
        <SummarySection title="Measured evidence" icon="analytics">
          {findings.map((finding) => finding.whatWeNoticed).join(" ")}
        </SummarySection>
        {fusion.conflict ? (
          <InfoBanner icon="rule" tone="warning">
            <span className="font-semibold">{fusion.conflict.title}. </span>
            {fusion.conflict.detail}
          </InfoBanner>
        ) : null}

        {leading ? (
          <div
            className={`card-shadow-lg mt-2 rounded-2xl border-l-4 bg-surface-container-lowest p-5 ${concernBorder[leading.concern]}`}
          >
            <p className="text-caption font-semibold tracking-wide text-primary uppercase">
              Primary area to investigate
            </p>
            <h2 className="mt-1 font-manrope text-headline-md text-on-surface">{leading.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <SupportBadge level={leading.support} />
              <ConcernBadge level={leading.concern} />
            </div>
            <p className="mt-4 text-body-md text-on-surface-variant">{leading.rationale}</p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl bg-primary/8 p-5">
          <h3 className="flex items-center gap-2 font-manrope text-body-md font-bold text-primary">
            <Icon name="neurology" size={18} />
            How the evidence fits together
          </h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{fusion.summary}</p>
        </div>

        {leading ? (
          <div className="mt-7">
            <h3 className="mb-3 font-manrope text-headline-md text-on-surface">
              Supporting evidence
            </h3>
            <ul className="space-y-2">
              {leading.supporting.map((s) => (
                <li
                  key={`${s.kind}-${s.label}`}
                  className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                    <Icon name={evidenceIcon[s.kind] ?? "insights"} size={18} />
                  </span>
                  <span>
                    <span className="block text-label-md text-on-surface">{s.label}</span>
                    <span className="block text-label-md font-normal text-on-surface-variant">
                      {s.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {leading.conflicting?.length ? (
              <div className="mt-3">
                <h4 className="mb-2 text-label-md text-on-surface-variant">
                  Evidence that doesn't fit
                </h4>
                <ul className="space-y-2">
                  {leading.conflicting.map((c) => (
                    <li
                      key={c.label}
                      className="rounded-2xl bg-warning-container px-4 py-3 text-label-md font-normal text-on-warning-container"
                    >
                      <span className="font-semibold">{c.label}: </span>
                      {c.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {alternates.length ? (
          <div className="mt-7">
            <h3 className="mb-1 font-manrope text-headline-md text-on-surface">
              Other possibilities
            </h3>
            <p className="mb-3 text-label-md font-normal text-on-surface-variant">
              Worth keeping open until a mechanic has looked.
            </p>
            <ul className="space-y-2">
              {alternates.map((h) => (
                <li
                  key={h.id}
                  className={`card-shadow rounded-2xl border-l-4 bg-surface-container-lowest p-4 ${concernBorder[h.concern]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-manrope text-body-md font-bold text-on-surface">
                      {h.title}
                    </h4>
                    <SupportBadge level={h.support} />
                  </div>
                  <p className="mt-2 text-label-md font-normal text-on-surface-variant">
                    {h.rationale}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {manualReferences.length ? (
          <SummarySection title="Manufacturer guidance / Manual reference" icon="menu_book">
            {manualReferences.map((citation) => (
              <span
                key={`${citation.documentId}-${citation.page}-${citation.section ?? ""}`}
                className="block"
              >
                {citation.manualTitle}, page {citation.page}
                {citation.section ? ` — ${citation.section}` : ""}
              </span>
            ))}
          </SummarySection>
        ) : null}

        <div className="mt-8 space-y-2">
          <PillButton icon="bookmark" onClick={save} disabled={saving}>
            {saving ? "Saving diagnosis…" : "Save to history"}
          </PillButton>
          <PillButton variant="secondary" icon="forum" onClick={() => navigate({ to: "/chat" })}>
            Add more evidence
          </PillButton>
        </div>

        <p className="mt-6 rounded-2xl bg-surface-container-low px-4 py-3 text-caption font-normal text-on-surface-variant">
          This summary is an informed starting point based on what you shared, not a confirmed
          repair diagnosis.{" "}
          {sessions.length > 0 ? "Past diagnoses stay in your history for comparison." : ""}
        </p>
      </Page>
    </AppShell>
  );
}

function SummarySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl bg-surface-container-low p-5">
      <h2 className="flex items-center gap-2 font-manrope text-body-md font-bold text-on-surface">
        <Icon name={icon} size={18} className="text-primary" />
        {title}
      </h2>
      <div className="mt-2 text-body-md text-on-surface-variant">{children}</div>
    </section>
  );
}
