import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Icon } from "@/components/ui-kit/Icon";
import { AnalyzingState, ErrorState } from "@/components/ui-kit/States";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { Composer } from "@/components/chat/Composer";
import { ToolPickerSheet } from "@/components/diagnostics/ToolPickerSheet";
import { vehicleLabel } from "@/lib/mocks/vehicles";
import { useStore } from "@/state/store";
import type { ChatAction } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Diagnostic conversation — AutoAssist" },
      {
        name: "description",
        content:
          "Talk through the problem with AutoAssist, attach photos or engine recordings, and build a shared picture of what's going on.",
      },
      { property: "og:title", content: "Diagnostic conversation — AutoAssist" },
      {
        property: "og:description",
        content: "Talk through the problem and attach evidence as you go.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const {
    messages,
    findings,
    currentVehicle,
    activeSession,
    sendUserMessage,
    retryAssistantResponse,
    ensureActiveDiagnosis,
    startNewDiagnosis,
    chatResponding,
  } = useStore();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [preparing, setPreparing] = useState(activeSession.id.startsWith("active_"));
  const [prepareError, setPrepareError] = useState(false);
  const navigate = useNavigate();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!activeSession.id.startsWith("active_")) {
      setPreparing(false);
      setPrepareError(false);
      return;
    }
    let cancelled = false;
    setPreparing(true);
    setPrepareError(false);
    void ensureActiveDiagnosis()
      .then(() => {
        if (!cancelled) setPreparing(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPreparing(false);
          setPrepareError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeSession.id, ensureActiveDiagnosis]);

  if (preparing) {
    return (
      <AppShell header={<TopBar title="Preparing diagnosis" showBack={false} />}>
        <AnalyzingState
          title="Preparing your diagnosis"
          detail="Connecting this conversation to your selected vehicle…"
        />
      </AppShell>
    );
  }

  if (prepareError) {
    return (
      <AppShell header={<TopBar title="Diagnosis" />}>
        <ErrorState
          title="We couldn't prepare this diagnosis"
          detail="Check your connection and try again before sending a message."
          onRetry={() => {
            setPrepareError(false);
            setPreparing(true);
            void ensureActiveDiagnosis()
              .then(() => setPreparing(false))
              .catch(() => {
                setPreparing(false);
                setPrepareError(true);
              });
          }}
        />
      </AppShell>
    );
  }

  const last = messages[messages.length - 1];
  const suggestions = last?.role === "assistant" ? (last.suggestions ?? []) : [];
  const followUpOptions = last?.role === "assistant" ? (last.followUpOptions ?? []) : [];
  const actions = last?.role === "assistant" ? (last.actions ?? []) : [];
  const hasUserReport = messages.some(
    (message) => message.role === "user" && (message.text?.trim().length ?? 0) >= 8,
  );

  return (
    <AppShell
      header={
        <TopBar
          title="Diagnosis"
          subtitle={currentVehicle ? vehicleLabel(currentVehicle) : undefined}
          onBack={() => navigate({ to: "/home" })}
          action={
            findings.length || hasUserReport ? (
              <button
                type="button"
                aria-label="See summary"
                onClick={() => navigate({ to: "/summary" })}
                className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary/8"
              >
                <Icon name="summarize" size={22} />
              </button>
            ) : null
          }
        />
      }
      footer={
        <>
          {suggestions.length ? (
            <div className="bg-surface px-5 pb-2">
              <SuggestionChips suggestions={suggestions} onPick={handleSuggestion} />
            </div>
          ) : null}
          {followUpOptions.length ? (
            <div className="bg-surface px-5 pb-2">
              <SuggestionChips
                suggestions={followUpOptions.map((item) => item.label)}
                onPick={(label) => {
                  const option = followUpOptions.find((item) => item.label === label);
                  if (
                    option?.questionType === "vehicle_confirmation" &&
                    option.id !== activeSession.vehicleId
                  ) {
                    void startNewDiagnosis(option.id)
                      .then(() => toast.success(`Started a new diagnosis for ${option.label}.`))
                      .catch((error) =>
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "We couldn't start that diagnosis.",
                        ),
                      );
                  } else if (option?.questionId)
                    sendUserMessage(option.label, {
                      questionId: option.questionId,
                      optionId: option.id,
                    });
                }}
              />
            </div>
          ) : null}
          {actions.length ? (
            <div className="bg-surface px-5 pb-2">
              <SuggestionChips
                suggestions={actions.map((action) => action.label)}
                onPick={(label) => {
                  const action = actions.find((item) => item.label === label);
                  if (action) handleAction(action);
                }}
              />
            </div>
          ) : null}
          <Composer
            disabled={chatResponding}
            onSend={sendUserMessage}
            onCamera={() => navigate({ to: "/capture", search: { mode: "engine" } })}
            onMic={() => navigate({ to: "/record" })}
            onTools={() => setToolsOpen(true)}
          />
        </>
      }
    >
      <div className="space-y-4 px-5 pt-2 pb-4">
        <p className="text-center text-caption font-normal text-on-surface-variant">
          Today · this conversation is saved to your account
        </p>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            finding={findings.find((f) => f.id === m.findingId)}
            onOpenFinding={(f) =>
              navigate({ to: "/result/$findingId", params: { findingId: f.id } })
            }
            onRetryResponse={retryAssistantResponse}
          />
        ))}
        {chatResponding ? (
          <p className="text-caption text-on-surface-variant" role="status" aria-live="polite">
            AutoAssist is reviewing the available evidence…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <ToolPickerSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </AppShell>
  );

  function handleSuggestion(value: string) {
    sendUserMessage(value);
  }

  function handleAction(action: ChatAction) {
    switch (action.type) {
      case "record_audio":
        void navigate({ to: "/record" });
        break;
      case "live_listen":
        void navigate({ to: "/live" });
        break;
      case "take_photo":
        void navigate({ to: "/capture", search: { mode: "engine" } });
        break;
      case "scan_dashboard":
        void navigate({ to: "/capture", search: { mode: "dashboard" } });
        break;
      case "upload_video":
        void navigate({ to: "/upload-video" });
        break;
      case "view_summary":
        void navigate({ to: "/summary" });
        break;
      case "professional_inspection":
        toast.info(action.label);
        break;
    }
  }
}
