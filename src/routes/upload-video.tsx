import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { AnalyzingState, ErrorState, InfoBanner } from "@/components/ui-kit/States";
import { PillButton } from "@/components/ui-kit/PillButton";
import { FindingSummaryCard } from "@/components/diagnostics/FindingCard";
import { analyzeVideoArtifacts } from "@/lib/api/diagnostics";
import type { AnalysisFinding } from "@/lib/types";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/upload-video")({
  head: () => ({
    meta: [
      { title: "Upload a video — AutoAssist" },
      {
        name: "description",
        content:
          "Share a short video of vibration, movement or smoke and AutoAssist will tell you what it can and cannot see.",
      },
      { property: "og:title", content: "Upload a video — AutoAssist" },
      {
        property: "og:description",
        content: "Share a short clip of vibration, movement or smoke.",
      },
    ],
  }),
  component: UploadVideoPage,
});

function UploadVideoPage() {
  const navigate = useNavigate();
  const { addFindingToConversation, attachEvidence, dispatch, ensureActiveDiagnosis } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"ready" | "selected" | "analyzing" | "done" | "error">(
    "ready",
  );
  const [results, setResults] = useState<AnalysisFinding[]>([]);
  const [artifacts, setArtifacts] = useState<Awaited<ReturnType<typeof analyzeVideoArtifacts>>>([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [conversationId, setConversationId] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function select(file: File) {
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("That video is larger than the 100 MB upload limit. Choose a shorter clip.");
      setPhase("error");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("selected");
  }

  async function run(file?: File) {
    const upload = file ?? selectedFile;
    if (!upload) {
      setPhase("ready");
      return;
    }
    setSelectedFile(upload);
    setPhase("analyzing");
    try {
      const context = await ensureActiveDiagnosis();
      setConversationId(context.conversationId);
      const nextArtifacts = await analyzeVideoArtifacts({
        file: upload,
        sessionId: context.sessionId,
        vehicleId: context.vehicleId,
      });
      const findings = nextArtifacts.map((item) => item.finding);
      setArtifacts(nextArtifacts);
      setResults(findings);
      setPhase("done");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't analyze that video.");
      setPhase("error");
    }
  }

  function addAll() {
    attachEvidence(
      {
        id: `att_video_${Date.now()}`,
        kind: "video",
        label: "Video clip",
        durationLabel: results[0]?.durationLabel,
      },
      undefined,
      conversationId,
    );
    const detected = results.filter((f) => f.detected);
    artifacts.forEach((artifact) => dispatch({ type: "addArtifact", artifact }));
    (detected.length ? detected : results.slice(0, 1)).forEach((f) =>
      addFindingToConversation(f, undefined, conversationId),
    );
    navigate({ to: "/chat" });
  }

  if (phase === "analyzing") {
    return (
      <AppShell header={<TopBar title="Analyzing video" showBack={false} />}>
        <AnalyzingState detail="We're comparing frames to look for movement, vibration and anything that appears or spreads." />
      </AppShell>
    );
  }

  if (phase === "error") {
    return (
      <AppShell header={<TopBar title="Video analysis" />}>
        <ErrorState
          title="We couldn't analyze that video"
          detail={errorMessage || "Try the same clip again, or choose a shorter MP4 or MOV file."}
          onRetry={() => (selectedFile ? void run(selectedFile) : setPhase("ready"))}
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<TopBar title="Upload a video" />}>
      <Page>
        {phase === "ready" ? (
          <>
            <InfoBanner icon="videocam">
              Five to ten seconds is ideal. Hold the phone steady and keep the camera outside the
              engine bay.
            </InfoBanner>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 py-14 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="upload" size={26} />
              </span>
              <span className="font-manrope text-body-lg font-bold text-on-surface">
                Choose a video
              </span>
              <span className="text-label-md font-normal text-on-surface-variant">
                MP4 or MOV, up to 30 seconds
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) select(file);
                event.target.value = "";
              }}
            />
          </>
        ) : phase === "selected" && selectedFile ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) select(file);
                event.target.value = "";
              }}
            />
            <InfoBanner icon="videocam">
              Review the selected clip before sending it for analysis.
            </InfoBanner>
            {previewUrl ? (
              <video
                className="mt-5 w-full rounded-2xl bg-black"
                src={previewUrl}
                controls
                preload="metadata"
              />
            ) : null}
            <p className="mt-3 truncate text-label-md text-on-surface">{selectedFile.name}</p>
            <p className="text-caption text-on-surface-variant">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
            <PillButton className="mt-5" icon="analytics" onClick={() => void run(selectedFile)}>
              Analyze video
            </PillButton>
            <PillButton
              variant="secondary"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose a different video
            </PillButton>
          </>
        ) : (
          <>
            <h2 className="font-manrope text-headline-md text-on-surface">
              What we found in your clip
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Both what we saw and what we specifically did not see — absence of evidence is useful
              too.
            </p>
            <div className="mt-5 space-y-3">
              {results.map((f) => (
                <FindingSummaryCard
                  key={f.id}
                  finding={f}
                  onOpen={() => navigate({ to: "/result/$findingId", params: { findingId: f.id } })}
                />
              ))}
            </div>
            <PillButton className="mt-6" onClick={addAll} icon="add_comment">
              Add to my diagnosis
            </PillButton>
            <PillButton variant="secondary" className="mt-2" onClick={() => setPhase("ready")}>
              Upload a different clip
            </PillButton>
          </>
        )}
      </Page>
    </AppShell>
  );
}
