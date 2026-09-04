import { useNavigate } from "@tanstack/react-router";
import { Icon } from "../ui-kit/Icon";

export interface DiagnosticTool {
  id: string;
  label: string;
  detail: string;
  icon: string;
  to: string;
  search?: Record<string, string> | undefined;
}

export const diagnosticTools: DiagnosticTool[] = [
  {
    id: "photo",
    label: "Take a photo",
    detail: "Leaks, wear, damage or anything that looks wrong.",
    icon: "photo_camera",
    to: "/capture",
    search: { mode: "engine" },
  },
  {
    id: "record",
    label: "Record engine sound",
    detail: "A short clip of a knock, squeal or rattle.",
    icon: "mic",
    to: "/record",
  },
  {
    id: "live",
    label: "Live engine listen",
    detail: "We listen while the engine runs and report as we go.",
    icon: "hearing",
    to: "/live",
  },
  {
    id: "dashboard",
    label: "Scan warning lights",
    detail: "Point at your dashboard to identify a lit indicator.",
    icon: "dashboard",
    to: "/capture",
    search: { mode: "dashboard" },
  },
  {
    id: "video",
    label: "Upload a video",
    detail: "Useful for movement, vibration or smoke.",
    icon: "videocam",
    to: "/upload-video",
  },
];

export function ToolPickerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Diagnostic tools"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-inverse-surface/45"
      />
      <div className="slide-up pb-safe relative w-full max-w-[430px] rounded-t-3xl bg-surface-container-lowest px-5 pt-3 pb-5">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-outline-variant" />
        <h2 className="font-manrope text-headline-md text-on-surface">Diagnostic tools</h2>
        <p className="mt-1 text-label-md font-normal text-on-surface-variant">
          Pick the kind of evidence that best matches what you noticed.
        </p>
        <ul className="mt-4 space-y-2">
          {diagnosticTools.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate({ to: tool.to, search: tool.search as never });
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={tool.icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-manrope text-body-md font-bold text-on-surface">
                    {tool.label}
                  </span>
                  <span className="block text-label-md font-normal text-on-surface-variant">
                    {tool.detail}
                  </span>
                </span>
                <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
