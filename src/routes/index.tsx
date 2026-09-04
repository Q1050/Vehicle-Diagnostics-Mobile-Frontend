import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoAssist — Calm AI help for car trouble" },
      {
        name: "description",
        content:
          "Open AutoAssist to describe a car problem, add a photo or engine recording, and get calm, plain-language guidance on what to check next.",
      },
      { property: "og:title", content: "AutoAssist — Calm AI help for car trouble" },
      {
        property: "og:description",
        content:
          "Describe a car problem, add a photo or engine recording, and get calm guidance on what to check next.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const { hydrated, onboarded, user, vehicles } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (!onboarded) navigate({ to: "/onboarding" });
      else if (!user) navigate({ to: "/login" });
      else if (vehicles.length === 0) navigate({ to: "/vehicle-setup" });
      else navigate({ to: "/home" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [hydrated, onboarded, user, vehicles.length, navigate]);

  return (
    <AppShell tone="primary" scroll={false}>
      <div className="flex h-full min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-white/12">
          <Icon name="car_repair" size={48} className="text-white" />
        </div>
        <div>
          <h1 className="font-manrope text-display text-white">AutoAssist</h1>
          <p className="mt-2 text-body-lg text-white/80">Calm, careful help with car trouble.</p>
        </div>
        <span className="pulse-ring mt-4 size-3 rounded-full bg-white/70" />
      </div>
    </AppShell>
  );
}
