import { useState } from "react";
import { Icon } from "../ui-kit/Icon";

export function Composer({
  onSend,
  onCamera,
  onMic,
  onTools,
  disabled = false,
}: {
  onSend: (text: string) => void;
  onCamera: () => void;
  onMic: () => void;
  onTools: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <div className="pb-safe sticky bottom-0 z-20 border-t border-outline-variant/60 bg-surface-container-lowest px-4 pt-3">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onTools}
          aria-label="Diagnostic tools"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        >
          <Icon name="add" size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-end gap-1 rounded-3xl bg-surface-container-high px-4 py-2">
          <textarea
            disabled={disabled}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              disabled ? "AutoAssist is reviewing the evidence…" : "Describe what you noticed…"
            }
            aria-label="Message"
            className="max-h-28 min-h-6 flex-1 resize-none bg-transparent py-1.5 text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
          />
          <button
            type="button"
            onClick={onCamera}
            aria-label="Take a photo"
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary"
          >
            <Icon name="photo_camera" size={20} />
          </button>
          <button
            type="button"
            onClick={onMic}
            aria-label="Record engine sound"
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary"
          >
            <Icon name="mic" size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
        >
          <Icon name="arrow_upward" size={22} />
        </button>
      </div>
    </div>
  );
}
