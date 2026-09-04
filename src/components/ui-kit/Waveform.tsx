import { cn } from "@/lib/utils";

/** Animated bar waveform used while recording / listening. */
export function LiveWaveform({
  bars = 32,
  active = true,
  className,
  barClassName = "bg-primary",
}: {
  bars?: number | undefined;
  active?: boolean | undefined;
  className?: string | undefined;
  barClassName?: string | undefined;
}) {
  return (
    <div className={cn("flex h-16 items-center justify-center gap-1", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full", barClassName, active && "wave-bar")}
          style={{
            animationDelay: `${(i % 8) * 0.09}s`,
            height: active ? undefined : `${18 + ((i * 13) % 40)}%`,
          }}
        />
      ))}
    </div>
  );
}

/** Static waveform used by playback surfaces. */
export function StaticWaveform({
  progress = 0,
  bars = 40,
  className,
}: {
  progress?: number | undefined;
  bars?: number | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex h-12 items-end gap-1", className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const played = i / bars <= progress;
        const h = 22 + ((i * 37) % 68);
        return (
          <span
            key={i}
            className={cn("flex-1 rounded-full", played ? "bg-primary" : "bg-primary/25")}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}
