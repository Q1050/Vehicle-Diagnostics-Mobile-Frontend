import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { PillButton } from "@/components/ui-kit/PillButton";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { Field } from "@/components/forms/Field";
import { EmptyState } from "@/components/ui-kit/States";
import { useStore } from "@/state/store";
import { vehicleLabel } from "@/lib/mocks/vehicles";
import type { Vehicle } from "@/lib/types";
import { updateVehicle } from "@/lib/api/vehicles";

export const Route = createFileRoute("/garage")({
  head: () => ({
    meta: [
      { title: "My garage — AutoAssist" },
      {
        name: "description",
        content:
          "Keep every car you look after in one garage, switch the vehicle a diagnosis applies to, and keep mileage up to date.",
      },
      { property: "og:title", content: "My garage — AutoAssist" },
      {
        property: "og:description",
        content: "Manage your vehicles and choose which one a diagnosis applies to.",
      },
    ],
  }),
  component: GaragePage,
});

function GaragePage() {
  const navigate = useNavigate();
  const { vehicles, currentVehicleId, dispatch } = useStore();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [mileage, setMileage] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(v: Vehicle) {
    setEditing(v);
    setMileage(String(v.mileage));
    setNickname(v.nickname ?? "");
  }

  async function save() {
    if (!editing || saving) return;
    setSaving(true);
    const parsed = Number(mileage.replace(/[^0-9]/g, ""));
    try {
      const vehicle = await updateVehicle(editing.id, {
        mileage: Number.isFinite(parsed) && parsed > 0 ? parsed : editing.mileage,
        nickname: nickname.trim() || undefined,
      });
      dispatch({ type: "updateVehicle", id: editing.id, patch: vehicle });
      toast.success(`${vehicleLabel(editing)} updated.`);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't update that vehicle.");
    } finally {
      setSaving(false);
    }
  }

  const current = vehicles.filter((v) => v.id === currentVehicleId);
  const others = vehicles.filter((v) => v.id !== currentVehicleId);

  return (
    <AppShell nav>
      <Page className="pt-6">
        <h1 className="font-manrope text-headline-lg text-on-surface">My garage</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Diagnoses use the vehicle you have selected, so details matter.
        </p>

        {vehicles.length === 0 ? (
          <EmptyState
            icon="directions_car"
            title="No vehicles yet"
            detail="Add your car so we can take its engine, fuel and mileage into account."
            actionLabel="Add a vehicle"
            onAction={() => navigate({ to: "/vehicle-setup" })}
          />
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {current.map((v) => (
                <VehicleCard key={v.id} vehicle={v} primary onEdit={() => openEdit(v)} />
              ))}
            </div>

            {others.length ? (
              <section className="mt-7">
                <h2 className="mb-3 font-manrope text-body-lg font-bold text-on-surface">
                  Other vehicles
                </h2>
                <div className="space-y-3">
                  {others.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      onEdit={() => openEdit(v)}
                      onSelect={() => {
                        dispatch({ type: "selectVehicle", id: v.id });
                        toast.success(`Switched to ${vehicleLabel(v)}.`);
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <PillButton
              variant="secondary"
              className="mt-6"
              icon="add"
              onClick={() => navigate({ to: "/vehicle-setup" })}
            >
              Add another vehicle
            </PillButton>
          </>
        )}

        {editing ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
            <div className="w-full max-w-[430px] rounded-t-3xl bg-surface p-5 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-manrope text-headline-md text-on-surface">
                  {vehicleLabel(editing)}
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setEditing(null)}
                  className="flex size-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                >
                  <Icon name="close" size={22} />
                </button>
              </div>
              <div className="space-y-4">
                <Field
                  label="Mileage"
                  icon="speed"
                  inputMode="numeric"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  hint="Helps us judge what wear is normal for this car."
                />
                <Field
                  label="Nickname (optional)"
                  icon="label"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Daily driver"
                />
              </div>
              <PillButton className="mt-6" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </PillButton>
            </div>
          </div>
        ) : null}
      </Page>
    </AppShell>
  );
}
