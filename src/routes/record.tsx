import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { LiveWaveform } from "@/components/ui-kit/Waveform";
import { AnalyzingState, ErrorState, InfoBanner } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import { analyzeAudioArtifact } from "@/lib/api/diagnostics";
import { useStore } from "@/state/store";
import { WavRecorder } from "@/lib/audio/wavRecorder";
import {
  ensureMediaPermission,
  isNativeAndroid,
  openAppSettings,
} from "@/lib/platform/mediaPermissions";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Record engine sound — AutoAssist" },
      {
        name: "description",
        content:
          "Record a short clip of a knock, squeal or rattle and AutoAssist will describe the pattern it hears.",
      },
      { property: "og:title", content: "Record engine sound — AutoAssist" },
      {
        property: "og:description",
        content: "Record a short engine clip and hear what pattern stands out.",
      },
    ],
  }),
  component: RecordPage,
});

function RecordPage() {
  const navigate = useNavigate();
  const { addFindingToConversation, attachEvidence, dispatch, ensureActiveDiagnosis } = useStore();
  const recorder = useRef<WavRecorder | null>(null);
  const recordedFile = useRef<Blob | null>(null);
  const [phase, setPhase] = useState<"ready" | "requesting" | "recording" | "analyzing" | "error">(
    "ready",
  );
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(
    () => () => {
      void recorder.current?.cancel();
    },
    [],
  );

  async function begin() {
    setPhase("requesting");
    setSeconds(0);
    recordedFile.current = null;
    try {
      const permission = await ensureMediaPermission("microphone");
      if (permission !== "granted") {
        setPermissionDenied(true);
        throw new Error(
          "Microphone permission is denied. Allow it in Android settings, then try again.",
        );
      }
      setPermissionDenied(false);
      const next = new WavRecorder();
      recorder.current = next;
      await next.start();
      setPhase("recording");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The microphone could not be started.",
      );
      setPhase("error");
    }
  }

  async function cancel() {
    await recorder.current?.cancel();
    recorder.current = null;
    setSeconds(0);
    setPhase("ready");
  }

  async function stop() {
    setPhase("analyzing");
    try {
      const file = await recorder.current?.stop();
      if (!file) throw new Error("Recording was not started.");
      recordedFile.current = file;
      await analyzeRecording(file);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't prepare that recording.",
      );
      setPhase("error");
    }
  }

  async function analyzeRecording(file: Blob) {
    setPhase("analyzing");
    try {
      const label = timeLabel(Math.max(seconds, 1));
      const context = await ensureActiveDiagnosis();
      const result = await analyzeAudioArtifact({
        file,
        filename: "engine-recording.wav",
        sessionId: context.sessionId,
        vehicleId: context.vehicleId,
      });
      const finding = { ...result.finding, durationLabel: label };
      attachEvidence(
        {
          id: `att_${finding.id}`,
          kind: "audio",
          label: "Engine recording",
          durationLabel: label,
        },
        undefined,
        context.conversationId,
      );
      addFindingToConversation(finding, undefined, context.conversationId);
      dispatch({ type: "addArtifact", artifact: { ...result, finding } });
      navigate({ to: "/result/$findingId", params: { findingId: finding.id } });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't analyze that recording.",
      );
      setPhase("error");
    }
  }

  if (phase === "analyzing") {
    return (
      <AppShell header={<TopBar title="Analyzing sound" showBack={false} />}>
        <AnalyzingState detail="We're checking the rhythm, pitch and how the sound changes over time." />
      </AppShell>
    );
  }

  if (phase === "error") {
    return (
      <AppShell header={<TopBar title="Engine recording" />}>
        <ErrorState
          title={
            recordedFile.current
              ? "We couldn't analyze that recording"
              : "Microphone access didn't work"
          }
          detail={
            recordedFile.current
              ? errorMessage || "Check your connection and try the same recording again."
              : errorMessage || "Allow microphone access in your device settings, then try again."
          }
          onRetry={() =>
            recordedFile.current ? void analyzeRecording(recordedFile.current) : void begin()
          }
          secondaryLabel={permissionDenied && isNativeAndroid() ? "Open settings" : undefined}
          onSecondary={permissionDenied ? () => void openAppSettings() : undefined}
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<TopBar title="Record engine sound" />}>
      <Page className="flex min-h-[80vh] flex-col">
        <InfoBanner icon="warning" tone="safety">
          Stay clear of belts, fans and hot surfaces. Park the car, apply the brake, and never reach
          into a running engine.
        </InfoBanner>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="relative flex size-44 items-center justify-center">
            {phase === "recording" ? (
              <>
                <span className="pulse-ring absolute inset-0 rounded-full bg-error/20" />
                <span
                  className="pulse-ring absolute inset-0 rounded-full bg-error/15"
                  style={{ animationDelay: "0.6s" }}
                />
              </>
            ) : null}
            <span
              className={`flex size-28 items-center justify-center rounded-full ${
                phase === "recording" ? "bg-error text-on-error" : "bg-primary text-on-primary"
              }`}
            >
              <Icon name="mic" size={44} filled />
            </span>
          </div>

          <p className="mt-8 font-manrope text-headline-lg tabular-nums text-on-surface">
            {timeLabel(seconds)}
          </p>
          <p className="mt-1 text-label-md font-normal text-on-surface-variant">
            {phase === "recording"
              ? "Listening — ten to fifteen seconds is plenty."
              : phase === "requesting"
                ? "Waiting for microphone permission…"
                : "Hold your phone about an arm's length from the engine."}
          </p>

          <LiveWaveform
            className="mt-8 w-full"
            active={phase === "recording"}
            barClassName={phase === "recording" ? "bg-error" : "bg-primary/40"}
          />
        </div>

        {phase === "ready" || phase === "requesting" ? (
          <PillButton
            icon="fiber_manual_record"
            onClick={() => void begin()}
            disabled={phase === "requesting"}
          >
            {phase === "requesting" ? "Requesting microphone…" : "Start recording"}
          </PillButton>
        ) : (
          <div className="space-y-2">
            <PillButton variant="danger" icon="stop_circle" onClick={stop} disabled={seconds < 3}>
              Stop and analyze
            </PillButton>
            <PillButton variant="secondary" onClick={() => void cancel()}>
              Cancel
            </PillButton>
          </div>
        )}
      </Page>
    </AppShell>
  );
}

function timeLabel(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
