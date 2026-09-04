import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { AnalyzingState, ErrorState } from "@/components/ui-kit/States";
import { analyzeImageArtifact } from "@/lib/api/diagnostics";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import { captureNativePhoto } from "@/lib/platform/mediaCapture";
import {
  isNativeAndroid,
  onAppStateChange,
  openAppSettings,
} from "@/lib/platform/mediaPermissions";
import {
  capturePreviewFrame,
  startCameraPreview,
  stopCameraPreview,
} from "@/lib/platform/cameraPreview";

type Mode = "engine" | "tire" | "dashboard";

export const Route = createFileRoute("/capture")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: (["engine", "tire", "dashboard"] as const).includes(search["mode"] as Mode)
      ? (search["mode"] as Mode)
      : "engine",
  }),
  head: () => ({
    meta: [
      { title: "Capture a photo — AutoAssist" },
      {
        name: "description",
        content:
          "Frame the engine bay, a tire or your dashboard and AutoAssist will describe what it can see and what to check next.",
      },
      { property: "og:title", content: "Capture a photo — AutoAssist" },
      {
        property: "og:description",
        content: "Frame the area and get a plain-language read on what it shows.",
      },
    ],
  }),
  component: CapturePage,
});

const modes: { id: Mode; label: string; hint: string }[] = [
  {
    id: "engine",
    label: "Engine bay",
    hint: "Keep the area in frame. Engine off and keep clear of moving parts.",
  },
  { id: "tire", label: "Tire", hint: "Capture the tread and sidewall clearly." },
  {
    id: "dashboard",
    label: "Dashboard",
    hint: "Keep warning lights and symbols sharp and fully visible.",
  },
];

function CapturePage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { addFindingToConversation, attachEvidence, dispatch, ensureActiveDiagnosis } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>(mode);
  const [phase, setPhase] = useState<"framing" | "preview" | "analyzing" | "error">("framing");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [captureError, setCaptureError] = useState("");

  function stopPreview() {
    stopCameraPreview(streamRef.current, videoRef.current);
    streamRef.current = null;
  }

  async function startPreview() {
    const video = videoRef.current;
    if (!video || phase !== "framing") return;
    stopPreview();
    setCaptureError("");
    try {
      streamRef.current = await startCameraPreview(video);
    } catch (error) {
      setCaptureError(
        error instanceof Error ? error.message : "Live camera preview is unavailable.",
      );
    }
  }

  useEffect(() => {
    if (phase === "framing") void startPreview();
    else stopPreview();
    return stopPreview;
    // Camera ownership follows the screen phase; helpers intentionally use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    let disposed = false;
    let listener: Awaited<ReturnType<typeof onAppStateChange>> = null;
    void onAppStateChange((isActive) => {
      if (!isActive) stopPreview();
      else if (!disposed && phase === "framing") void startPreview();
    }).then((handle) => {
      if (disposed) void handle?.remove();
      else listener = handle;
    });
    return () => {
      disposed = true;
      stopPreview();
      void listener?.remove();
    };
    // Re-registering on phase changes keeps the resume callback current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const active = modes.find((m) => m.id === activeMode)!;

  async function choosePhoto(source: "camera" | "library") {
    setCaptureError("");
    if (!isNativeAndroid()) {
      (source === "camera" ? cameraInputRef : fileInputRef).current?.click();
      return;
    }
    try {
      const file = await captureNativePhoto(source);
      if (file) selectFile(file);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : "The camera could not be opened.");
    }
  }

  async function capturePhoto() {
    setCaptureError("");
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      setCaptureError("The live camera is still starting or unavailable on this device.");
      return;
    }
    try {
      const file = await capturePreviewFrame(video);
      stopPreview();
      selectFile(file);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : "The photo could not be captured.");
    }
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    setPhase("framing");
  }

  function selectFile(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("preview");
  }

  async function run(file: File) {
    setSelectedFile(file);
    setPhase("analyzing");
    try {
      const context = await ensureActiveDiagnosis();
      const result = await analyzeImageArtifact({
        file,
        mode: activeMode,
        sessionId: context.sessionId,
        vehicleId: context.vehicleId,
      });
      const finding = result.finding;
      attachEvidence(
        {
          id: `att_${finding.id}`,
          kind: "image",
          label: activeMode === "dashboard" ? "Dashboard photo" : `${active.label} photo`,
        },
        undefined,
        context.conversationId,
      );
      addFindingToConversation(finding, undefined, context.conversationId);
      dispatch({ type: "addArtifact", artifact: result });
      dispatch({ type: "setFusion", fusion: null });
      navigate({ to: "/result/$findingId", params: { findingId: finding.id } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't analyze that photo.");
      setPhase("error");
    }
  }

  if (phase === "analyzing") {
    return (
      <AppShell header={<TopBar title="Analyzing photo" showBack={false} />}>
        <AnalyzingState detail="We're looking at colour, texture and where things sit relative to each other." />
      </AppShell>
    );
  }

  if (phase === "error") {
    return (
      <AppShell header={<TopBar title="Photo analysis" />}>
        <ErrorState
          title="We couldn't analyze that photo"
          detail={errorMessage || "Check your connection and try the same photo again."}
          onRetry={() => (selectedFile ? void run(selectedFile) : fileInputRef.current?.click())}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      tone="dark"
      scroll={false}
      header={<TopBar title="Take a photo" variant="dark" />}
      className="flex min-h-0 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-safe">
        <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 text-white">
          <p className="text-label-md font-semibold">
            {phase === "preview" ? "Check the photo" : active.label}
          </p>
          <p className="mt-0.5 text-caption leading-snug text-white/80">
            {phase === "preview" ? "Make sure the area is clear and in focus." : active.hint}
          </p>
        </div>

        {captureError ? (
          <div className="shrink-0 rounded-2xl bg-error-container px-4 py-3 text-on-error-container">
            <p className="text-label-md font-normal">{captureError}</p>
            {isNativeAndroid() ? (
              <div className="mt-2 flex gap-4">
                <button
                  type="button"
                  className="text-label-md font-semibold underline"
                  onClick={() => void openAppSettings()}
                >
                  Open settings
                </button>
                <button
                  type="button"
                  className="text-label-md font-semibold underline"
                  onClick={() => void choosePhoto("camera")}
                >
                  Use device camera instead
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 text-label-md font-semibold underline"
                onClick={() => cameraInputRef.current?.click()}
              >
                Choose a photo instead
              </button>
            )}
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b2436] to-[#0b101c]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected vehicle area"
              className="size-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              aria-label="Live rear camera preview"
              autoPlay
              muted
              playsInline
              className="size-full object-cover"
            />
          )}
          {phase === "framing" ? (
            <>
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
              <div className="pointer-events-none absolute inset-8 flex items-center justify-center">
                <Icon name="center_focus_weak" size={40} className="text-white/50" />
              </div>
            </>
          ) : null}
        </div>

        <div className="shrink-0 pb-4">
          {phase === "preview" && selectedFile ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full bg-white/15 px-4 py-3 text-label-md font-semibold text-white"
                onClick={retake}
              >
                Retake
              </button>
              <button
                type="button"
                className="rounded-full bg-white px-4 py-3 text-label-md font-semibold text-[#0d1220]"
                onClick={() => void run(selectedFile)}
              >
                Analyze photo
              </button>
            </div>
          ) : (
            <>
              <div className="no-scrollbar mb-3 flex justify-center gap-2 overflow-x-auto">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMode(m.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-label-md",
                      m.id === activeMode ? "bg-white text-[#0d1220]" : "bg-white/12 text-white",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between px-4">
                <button
                  type="button"
                  aria-label="Choose from library"
                  onClick={() => void choosePhoto("library")}
                  className="flex size-12 items-center justify-center rounded-full bg-white/12 text-white"
                >
                  <Icon name="photo_library" size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => void capturePhoto()}
                  aria-label="Capture photo"
                  className="flex size-20 items-center justify-center rounded-full border-4 border-white/40 bg-white"
                >
                  <span className="size-14 rounded-full bg-white ring-2 ring-[#0d1220]/10" />
                </button>
                <span className="size-12" aria-hidden="true" />
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
            event.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
            event.target.value = "";
          }}
        />
      </div>
    </AppShell>
  );
}
