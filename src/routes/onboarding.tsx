import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { PillButton } from "@/components/ui-kit/PillButton";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "How AutoAssist works" },
      {
        name: "description",
        content:
          "Three quick steps: describe the problem, add a photo or engine recording, and get calm guidance you can act on.",
      },
      { property: "og:title", content: "How AutoAssist works" },
      {
        property: "og:description",
        content: "Describe the problem, add evidence, get calm guidance you can act on.",
      },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    icon: "forum",
    title: "Describe it in your own words",
    body: "No jargon needed. Tell AutoAssist what you noticed — a noise, a smell, a light, a feeling — and it asks the follow-up questions a good mechanic would.",
  },
  {
    icon: "perm_media",
    title: "Show it, or let it listen",
    body: "Add a photo of what looks wrong, record ten seconds of engine sound, or upload a short video. Evidence turns a guess into an informed observation.",
  },
  {
    icon: "insights",
    title: "Get a calm, honest read",
    body: "AutoAssist explains what it noticed, why it matters and what to check next — and tells you plainly when the evidence isn't clear enough.",
  },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const current = steps[step]!;
  const last = step === steps.length - 1;

  function finish() {
    dispatch({ type: "onboarded" });
    navigate({ to: "/login" });
  }

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="font-manrope text-body-md font-bold text-primary">AutoAssist</span>
          <button
            type="button"
            onClick={finish}
            className="text-label-md text-on-surface-variant hover:text-primary"
          >
            Skip
          </button>
        </div>

        <Page className="flex flex-1 flex-col justify-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Icon name={current.icon} size={38} />
          </div>
          <h1 className="mt-8 font-manrope text-headline-lg text-on-surface">{current.title}</h1>
          <p className="mt-4 text-body-lg text-on-surface-variant">{current.body}</p>
        </Page>

        <Page>
          <div className="mb-6 flex gap-2">
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-outline-variant"}`}
              />
            ))}
          </div>
          <PillButton onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? "Get started" : "Continue"}
          </PillButton>
          {step > 0 ? (
            <PillButton variant="ghost" className="mt-2" onClick={() => setStep(step - 1)}>
              Back
            </PillButton>
          ) : null}
        </Page>
      </div>
    </AppShell>
  );
}
