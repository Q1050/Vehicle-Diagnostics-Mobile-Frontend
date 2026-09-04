import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { Icon } from "../ui-kit/Icon";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  subtitle,
  onBack,
  showBack = true,
  action,
  variant = "surface",
}: {
  title?: ReactNode | undefined;
  subtitle?: ReactNode | undefined;
  onBack?: (() => void) | undefined;
  showBack?: boolean | undefined;
  action?: ReactNode | undefined;
  variant?: "surface" | "transparent" | "dark" | undefined;
}) {
  const router = useRouter();
  const back = onBack ?? (() => router.history.back());

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-2 px-4 pt-4 pb-3",
        variant === "surface" && "bg-surface/95 backdrop-blur",
        variant === "dark" && "text-white",
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={back}
          aria-label="Go back"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
            variant === "dark"
              ? "bg-white/12 text-white hover:bg-white/20"
              : "text-on-surface hover:bg-surface-container-high",
          )}
        >
          <Icon name="arrow_back" size={22} />
        </button>
      ) : (
        <span className="size-10 shrink-0" />
      )}
      <div className="min-w-0 flex-1 text-center">
        {title ? <h1 className="truncate font-manrope text-body-lg font-bold">{title}</h1> : null}
        {subtitle ? (
          <p
            className={cn(
              "truncate text-caption",
              variant === "dark" ? "text-white/70" : "text-on-surface-variant",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex size-10 shrink-0 items-center justify-center">{action}</div>
    </header>
  );
}
