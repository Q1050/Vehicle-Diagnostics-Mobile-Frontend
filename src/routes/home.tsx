import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { SectionTitle } from "@/components/ui-kit/States";
import { diagnosticTools, ToolPickerSheet } from "@/components/diagnostics/ToolPickerSheet";
import { FindingSummaryCard } from "@/components/diagnostics/FindingCard";
import { useStore } from "@/state/store";
import { toast } from "sonner";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Your garage dashboard — AutoAssist" },
      {
        name: "description",
        content:
          "See your current vehicle, start a new diagnosis, and jump straight to a photo, engine recording or dashboard scan.",
      },
      { property: "og:title", content: "Your garage dashboard — AutoAssist" },
      {
        property: "og:description",
        content: "Start a diagnosis or add evidence about your current vehicle.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, currentVehicle, sessions, startNewDiagnosis } = useStore();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const recent = sessions[0];

  return (
    <AppShell nav>
      <Page className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-label-md font-normal text-on-surface-variant">
              {greeting()}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </p>
            <h1 className="mt-1 font-manrope text-headline-lg text-on-surface">
              How's your car today?
            </h1>
          </div>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex size-11 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
          >
            <Icon name="person" size={22} />
          </Link>
        </div>

        <div className="mt-6">
          {currentVehicle ? (
            <VehicleCard
              vehicle={currentVehicle}
              primary
              onEdit={() => navigate({ to: "/garage" })}
            />
          ) : (
            <Link
              to="/vehicle-setup"
              className="card-shadow flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4"
            >
              <Icon name="add_circle" size={26} className="text-primary" />
              <span className="text-body-md font-semibold text-on-surface">Add your vehicle</span>
            </Link>
          )}
        </div>

        <div className="card-shadow-lg mt-5 rounded-2xl bg-primary p-5 text-on-primary">
          <h2 className="font-manrope text-headline-md">What's happening with your car?</h2>
          <p className="mt-2 text-body-md text-white/85">
            Describe it in your own words. AutoAssist guides you through the evidence that can help
            you what to check next.
          </p>
          <button
            type="button"
            onClick={() => {
              if (starting) return;
              setStarting(true);
              void startNewDiagnosis()
                .then(() => navigate({ to: "/chat" }))
                .catch((error) =>
                  toast.error(
                    error instanceof Error ? error.message : "We couldn't start a diagnosis.",
                  ),
                )
                .finally(() => setStarting(false));
            }}
            disabled={starting}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-body-md font-semibold text-primary"
          >
            <Icon name="stethoscope" size={20} />
            {starting ? "Starting diagnosis…" : "Start a diagnosis"}
          </button>
        </div>

        <div className="mt-8">
          <SectionTitle>Quick diagnostic tools</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {diagnosticTools.slice(0, 4).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (starting) return;
                  setStarting(true);
                  void startNewDiagnosis()
                    .then(() => navigate({ to: tool.to, search: tool.search as never }))
                    .catch((error) =>
                      toast.error(
                        error instanceof Error ? error.message : "We couldn't start a diagnosis.",
                      ),
                    )
                    .finally(() => setStarting(false));
                }}
                disabled={starting}
                className="card-shadow flex flex-col items-start gap-2 rounded-2xl bg-surface-container-lowest p-4 text-left"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={tool.icon} size={20} />
                </span>
                <span className="font-manrope text-label-md font-bold text-on-surface">
                  {tool.label}
                </span>
                <span className="text-caption font-normal text-on-surface-variant">
                  {tool.detail}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            className="mt-3 w-full rounded-full py-2 text-label-md font-semibold text-primary"
          >
            See all tools
          </button>
        </div>

        {recent ? (
          <div className="mt-8">
            <SectionTitle
              action={
                <Link to="/history" className="text-label-md font-semibold text-primary">
                  View all
                </Link>
              }
            >
              Most recent diagnosis
            </SectionTitle>
            <Link to="/history/$sessionId" params={{ sessionId: recent.id }} className="block">
              <div className="card-shadow rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-caption font-normal text-on-surface-variant">
                  {formatDate(recent.date)}
                </p>
                <h3 className="mt-1 font-manrope text-body-lg font-bold text-on-surface">
                  {recent.headline}
                </h3>
                <p className="mt-1 line-clamp-2 text-label-md font-normal text-on-surface-variant">
                  {recent.complaint}
                </p>
              </div>
            </Link>
            {recent.findings[0] ? (
              <div className="mt-3">
                <FindingSummaryCard finding={recent.findings[0]} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Page>

      <ToolPickerSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </AppShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
