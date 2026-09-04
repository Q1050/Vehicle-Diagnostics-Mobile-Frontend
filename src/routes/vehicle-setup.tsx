import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Field } from "@/components/forms/Field";
import { PillButton } from "@/components/ui-kit/PillButton";
import { InfoBanner } from "@/components/ui-kit/States";
import { createVehicle } from "@/lib/api/vehicles";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/vehicle-setup")({
  head: () => ({
    meta: [
      { title: "Add your vehicle — AutoAssist" },
      {
        name: "description",
        content:
          "Add your car's year, make, model and mileage so AutoAssist can tailor its guidance to your vehicle.",
      },
      { property: "og:title", content: "Add your vehicle — AutoAssist" },
      {
        property: "og:description",
        content: "Tell AutoAssist about your car so guidance fits your vehicle.",
      },
    ],
  }),
  component: VehicleSetup,
});

const empty = { year: "", make: "", model: "", trim: "", mileage: "", nickname: "" };

function VehicleSetup() {
  const { dispatch, vehicles } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit() {
    const next: Record<string, string> = {};
    const year = Number(form.year);
    if (!year || year < 1950 || year > 2027) next["year"] = "Enter a year between 1950 and 2027.";
    if (!form.make.trim()) next["make"] = "Which make is it?";
    if (!form.model.trim()) next["model"] = "Which model is it?";
    const mileage = Number(form.mileage.replace(/[^0-9]/g, ""));
    if (!mileage) next["mileage"] = "An approximate figure is fine.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const vehicle = await createVehicle({
        year,
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim() || undefined,
        nickname: form.nickname.trim() || undefined,
        mileage,
      });
      dispatch({ type: "addVehicle", vehicle });
      dispatch({ type: "selectVehicle", id: vehicle.id });
      toast.success("Vehicle added to your garage.");
      navigate({ to: "/home" });
    } catch {
      toast.error("We couldn't save that vehicle. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell header={<TopBar title="Add a vehicle" showBack={vehicles.length > 0} />}>
      <Page>
        <h2 className="font-manrope text-headline-lg text-on-surface">Tell us about your car</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Knowing the vehicle helps AutoAssist judge what's normal and what isn't.
        </p>

        <div className="mt-6 space-y-4">
          <Field
            label="Year"
            inputMode="numeric"
            placeholder="2018"
            value={form.year}
            onChange={set("year")}
            error={errors["year"]}
          />
          <Field
            label="Make"
            placeholder="Toyota"
            value={form.make}
            onChange={set("make")}
            error={errors["make"]}
          />
          <Field
            label="Model"
            placeholder="Corolla"
            value={form.model}
            onChange={set("model")}
            error={errors["model"]}
          />
          <Field
            label="Trim (optional)"
            placeholder="LE"
            value={form.trim}
            onChange={set("trim")}
          />
          <Field
            label="Mileage"
            inputMode="numeric"
            placeholder="82,450"
            value={form.mileage}
            onChange={set("mileage")}
            error={errors["mileage"]}
            hint="An approximate figure is fine."
          />
          <Field
            label="Nickname (optional)"
            placeholder="Daily driver"
            value={form.nickname}
            onChange={set("nickname")}
          />
        </div>

        <div className="mt-6">
          <InfoBanner icon="shield">
            Vehicle details are saved to your AutoAssist account and used to organize diagnoses.
          </InfoBanner>
        </div>

        <PillButton className="mt-6" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save vehicle"}
        </PillButton>
      </Page>
    </AppShell>
  );
}
