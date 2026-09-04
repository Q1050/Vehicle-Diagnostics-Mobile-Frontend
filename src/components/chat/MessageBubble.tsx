import type { AnalysisFinding, ChatMessage } from "@/lib/types";
import { Icon } from "../ui-kit/Icon";
import { StaticWaveform } from "../ui-kit/Waveform";
import { FindingSummaryCard } from "../diagnostics/FindingCard";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  finding,
  onOpenFinding,
  onRetryResponse,
}: {
  message: ChatMessage;
  finding?: AnalysisFinding | undefined;
  onOpenFinding?: ((finding: AnalysisFinding) => void) | undefined;
  onRetryResponse?: ((message: ChatMessage) => void) | undefined;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("slide-in flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[86%] flex-col gap-2", isUser && "items-end")}>
        {!isUser ? (
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="neurology" size={14} />
            </span>
            <span className="text-caption text-on-surface-variant">AutoAssist</span>
          </div>
        ) : null}

        {message.attachment ? <AttachmentBubble message={message} /> : null}

        {message.text ? (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-body-md",
              isUser
                ? "rounded-br-md bg-primary text-on-primary"
                : "card-shadow rounded-bl-md bg-surface-container-lowest text-on-surface",
            )}
          >
            {message.text}
          </div>
        ) : null}

        {message.retryResponse && onRetryResponse ? (
          <button
            type="button"
            className="text-label font-medium text-primary"
            onClick={() => onRetryResponse(message)}
          >
            Retry response
          </button>
        ) : null}

        {!isUser && message.citations?.length ? (
          <details className="card-shadow w-full rounded-xl bg-surface-container-lowest px-3 py-2 text-caption text-on-surface-variant">
            <summary className="cursor-pointer font-medium text-on-surface">
              Manual guidance sources
            </summary>
            <ul className="mt-2 space-y-1">
              {message.citations.map((citation) => (
                <li key={`${citation.documentId}-${citation.ref}`}>
                  [{citation.ref}] {citation.manualTitle} — p.{citation.page}
                  {citation.section ? ` · ${citation.section}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-2">Reference guidance only; not a detected fault.</p>
          </details>
        ) : null}

        {finding ? (
          <FindingSummaryCard
            finding={finding}
            onOpen={onOpenFinding ? () => onOpenFinding(finding) : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

function AttachmentBubble({ message }: { message: ChatMessage }) {
  const a = message.attachment!;
  if (a.kind === "image") {
    return (
      <div className="card-shadow overflow-hidden rounded-2xl bg-surface-container-high">
        {a.url ? (
          <img src={a.url} alt={a.label} className="h-40 w-56 object-cover" />
        ) : (
          <div className="flex h-40 w-56 items-center justify-center text-on-surface-variant">
            <Icon name="image" size={32} />
          </div>
        )}
        <p className="px-3 py-2 text-caption text-on-surface-variant">{a.label}</p>
      </div>
    );
  }
  return (
    <div className="card-shadow flex w-64 items-center gap-3 rounded-2xl bg-surface-container-lowest px-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
        <Icon name={a.kind === "audio" ? "graphic_eq" : "videocam"} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <StaticWaveform bars={22} progress={0} className="h-6" />
      </div>
      <span className="text-caption text-on-surface-variant">{a.durationLabel ?? ""}</span>
    </div>
  );
}
