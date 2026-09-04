import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "../ui-kit/Icon";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/history", label: "History", icon: "history" },
  { to: "/garage", label: "Garage", icon: "directions_car" },
  { to: "/profile", label: "Profile", icon: "person" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t border-outline-variant/60 bg-surface-container-lowest/95 backdrop-blur"
    >
      <ul className="pb-safe flex items-stretch justify-around px-2 pt-2">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-caption font-semibold transition-colors",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <Icon name={item.icon} filled={active} size={24} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
