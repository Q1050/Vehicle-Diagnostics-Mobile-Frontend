import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string | undefined;
  filled?: boolean | undefined;
  /** Optical size / font-size in px. */
  size?: number | undefined;
}

/** Material Symbols icon, matching the Stitch exports. */
export function Icon({ name, className, filled, size }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", filled && "icon-fill", className)}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
