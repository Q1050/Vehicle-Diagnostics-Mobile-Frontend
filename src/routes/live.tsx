import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { LiveWaveform } from "@/components/ui-kit/Waveform";
import { InfoBanner } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import { ConfidenceBadge } from "@/components/ui-kit/Badges";
import { openLiveAudioSession, type LiveAudioSession } from "@/lib/api/liveAudio";
import type { LiveEvent, LiveListenState } from "@/lib/types";
import type { LiveDiagnosticUpdateDto } from "@/lib/api/dto/liveAudio";
import { mapLiveUpdateToPresentation, mapLiveUpdatesToFinding } from "@/lib/api/adapters/liveAudio";
import { useStore } from "@/state/store";
import {
  ensureMediaPermission,
  isNativeAndroid,
  openAppSettings,
} from "@/lib/platform/mediaPermissions";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live engine listen — AutoAssist" },
      {
        name: "description",
        content:
          "AutoAssist listens while your engine runs and reports patterns as they stabilise, so you can stop as soon as it has enough.",
      },
      { property: "og:title", content: "Live engine listen — AutoAssist" },
      {
        property: "og:description",
        content: "Listen live and watch findings stabilise in real time.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const navigate = useNavigate();
  const { addFindingToConversation, attachEvidence, dispatch, ensureActiveDiagnosis } = useStore();
  const [state, setState] = useState<LiveListenState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [summary, setSummary] = useState("Press Start Listening when you're ready.");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const sessionRef = useRef<LiveAudioSession | null>(null);
  const updatesRef = useRef<LiveDiagnosticUpdateDto[]>([]);
  const conversationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => sessionRef.current?.stop();
  }, []);

  async function start() {
    if (state !== "idle" && state !== "error") return;
    setState("connecting");
    setSummary("Requesting microphone access…");
    setSeconds(0);
    setEvents([]);
    updatesRef.current = [];
    try {
      const permission = await ensureMediaPermission("microphone");
      if (permission !== "granted") {
        setPermissionDenied(true);
        throw new Error(
          "Microphone permission is denied. Allow it in Android settings, then try again.",
        );
      }
      setPermissionDenied(false);
      const context = await ensureActiveDiagnosis();
      conversationRef.current = context.conversationId;
      sessionRef.current = openLiveAudioSession(
        {
          onOpen: () => {
            setState("listening");
            setSummary("Listening for a pattern… the first update takes about four seconds.");
          },
          onUpdate: (msg) => {
            updatesRef.current.push(msg);
            const presentation = mapLiveUpdateToPresentation(msg);
            setEvents(presentation.events);
            setSummary(presentation.summary);
            if (msg.stabilized_events.some((event) => event.active)) {
              setState("event-detected");
            }
          },
          onError: (message) => {
            sessionRef.current?.stop();
            sessionRef.current = null;
            setSummary(message || "We couldn't start Live Listen. Check microphone access.");
            setState("error");
          },
        },
        { sessionId: context.sessionId, vehicleId: context.vehicleId },
      );
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "We couldn't start Live Listen.");
      setState("error");
    }
  }

  useEffect(() => {
    if (state !== "listening" && state !== "event-detected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  function finish() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    const label = timeLabel(seconds);
    attachEvidence(
      {
        id: `att_live_${Date.now()}`,
        kind: "audio",
        label: "Live engine listen",
        durationLabel: label,
      },
      undefined,
      conversationRef.current,
    );
    const finding = mapLiveUpdatesToFinding(updatesRef.current, label);
    const evidence = updatesRef.current.flatMap((update) => update.evidence);
    dispatch({
      type: "addArtifact",
      artifact: {
        id: `art_${finding.id}`,
        kind: "live",
        finding,
        evidence,
        raw: updatesRef.current,
      },
    });
    addFindingToConversation(
      finding,
      "Here's what stood out while I was listening. A mechanic should confirm it before any parts are replaced.",
      conversationRef.current,
    );
    navigate({ to: "/chat" });
  }

  const listening = state === "listening" || state === "event-detected";

  return (
    <AppShell
      tone="dark"
      header={<TopBar title="Live engine listen" variant="dark" />}
      footer={
        <Page className="pb-safe pt-4">
          {state === "idle" || state === "error" ? (
            <PillButton variant="onPrimary" icon="hearing" onClick={() => void start()}>
              {state === "error" ? "Try Live Listen again" : "Start listening"}
            </PillButton>
          ) : (
            <PillButton
              variant="onPrimary"
              icon="stop_circle"
              onClick={finish}
              disabled={!listening}
            >
              Stop listening
            </PillButton>
          )}
        </Page>
      }
    >
      <Page>
        <InfoBanner icon="warning" tone="safety">
          Keep the bonnet propped safely and stand clear of the fan and belts while the engine runs.
        </InfoBanner>

        <div className="flex flex-col items-center py-8">
          <div className="relative flex size-40 items-center justify-center">
            {listening ? (
              <>
                <span className="pulse-ring absolute inset-0 rounded-full bg-white/20" />
                <span
                  className="pulse-ring absolute inset-0 rounded-full bg-white/15"
                  style={{ animationDelay: "0.7s" }}
                />
              </>
            ) : null}
            <span className="flex size-24 items-center justify-center rounded-full bg-white/15 text-white">
              <Icon name="hearing" size={40} />
            </span>
          </div>
          <p className="mt-6 font-manrope text-headline-lg tabular-nums text-white">
            {timeLabel(seconds)}
          </p>
          <p className="mt-1 w-full max-w-[22rem] text-center text-label-md font-normal text-white/70">
            {summary}
          </p>
          {state === "error" && permissionDenied && isNativeAndroid() ? (
            <button
              type="button"
              className="mt-3 text-label-md font-semibold text-white underline"
              onClick={() => void openAppSettings()}
            >
              Open settings
            </button>
          ) : null}
          <LiveWaveform className="mt-6 w-full" active={listening} barClassName="bg-white/80" />
        </div>

        <h2 className="mt-2 font-manrope text-body-lg font-bold text-white">Live findings</h2>
        <ul className="mt-3 space-y-2">
          {events.length === 0 ? (
            <li className="rounded-2xl bg-white/8 px-4 py-4 text-label-md font-normal text-white/70">
              Nothing conclusive yet — that's normal in the first few seconds.
            </li>
          ) : null}
          {events.map((e) => (
            <li key={e.id} className="slide-in rounded-2xl bg-white/8 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-manrope text-body-md font-bold text-white">{e.title}</h3>
                {e.stabilized ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-caption font-semibold text-white">
                    Stable
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-label-md font-normal text-white/70">{e.detail}</p>
              <div className="mt-2">
                <ConfidenceBadge level={e.confidence} />
              </div>
            </li>
          ))}
        </ul>
      </Page>
    </AppShell>
  );
}

function timeLabel(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
