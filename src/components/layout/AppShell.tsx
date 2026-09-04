import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

/**
 * Mobile-first frame. On phones it fills the viewport; on larger screens it
 * centres a phone-width column so the Stitch layouts keep their proportions.
 */
export function AppShell({
  children,
  header,
  footer,
  nav = false,
  tone = "surface",
  scroll = true,
  className,
}: {
  children: ReactNode;
  header?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  nav?: boolean | undefined;
  tone?: "surface" | "primary" | "dark" | undefined;
  scroll?: boolean | undefined;
  className?: string | undefined;
}) {
  const tones = {
    surface: "bg-surface text-on-surface",
    primary: "bg-primary text-on-primary",
    dark: "bg-[#0d1220] text-white",
  } as const;

  return (
    <div className={cn("min-h-dvh w-full", tones[tone])}>
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col sm:shadow-xl",
          tones[tone],
        )}
      >
        {header}
        <main
          className={cn(
            "min-w-0 flex-1",
            scroll ? "overflow-y-auto" : "overflow-hidden",
            className,
          )}
        >
          {children}
        </main>
        {footer}
        {nav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

/** Standard 20px page gutter from DESIGN.md. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-8", className)}>{children}</div>;
}
