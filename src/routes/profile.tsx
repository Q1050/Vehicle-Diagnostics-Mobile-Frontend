import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui-kit/Icon";
import { PillButton } from "@/components/ui-kit/PillButton";
import { InfoBanner } from "@/components/ui-kit/States";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/state/store";
import { vehicleLabel } from "@/lib/mocks/vehicles";
import { signOut } from "@/lib/api/auth";
import {
  getMediaPermission,
  isNativeAndroid,
  onAppResume,
  openAppSettings,
  requestMediaPermission,
  type MediaPermission,
  type MediaPermissionState,
} from "@/lib/platform/mediaPermissions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile and settings — AutoAssist" },
      {
        name: "description",
        content:
          "Manage your AutoAssist account, camera and microphone access, diagnosis reminders, and sign out of this device.",
      },
      { property: "og:title", content: "Profile and settings — AutoAssist" },
      {
        property: "og:description",
        content: "Account details, permissions and notification preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, vehicles, sessions, currentVehicle, notifications, dispatch } = useStore();
  const [permissions, setPermissions] = useState<Record<MediaPermission, MediaPermissionState>>({
    camera: "unknown",
    microphone: "unknown",
  });

  const refreshPermissions = useCallback(async () => {
    const [camera, microphone] = await Promise.all([
      getMediaPermission("camera"),
      getMediaPermission("microphone"),
    ]);
    setPermissions({ camera, microphone });
  }, []);

  useEffect(() => {
    void refreshPermissions();
    let handle: Awaited<ReturnType<typeof onAppResume>> = null;
    void onAppResume(() => void refreshPermissions()).then((listener) => {
      handle = listener;
    });
    return () => {
      void handle?.remove();
    };
  }, [refreshPermissions]);

  async function changePermission(kind: MediaPermission, enabled: boolean) {
    if (!enabled && permissions[kind] === "granted") {
      if (isNativeAndroid()) {
        toast.info("Android permissions can only be removed in system settings.");
        await openAppSettings();
      } else {
        toast.info("Change this permission in your browser's site settings.");
      }
      return;
    }
    const state = await requestMediaPermission(kind);
    setPermissions((current) => ({ ...current, [kind]: state }));
    if (state !== "granted" && state !== "limited") {
      toast.error(`${kind === "camera" ? "Camera" : "Microphone"} permission was not granted.`);
    }
  }

  return (
    <AppShell nav>
      <Page className="pt-6">
        <h1 className="font-manrope text-headline-lg text-on-surface">Profile</h1>

        <div className="card-shadow mt-5 flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary font-manrope text-body-lg font-bold">
            {(user?.name ?? "Guest")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-manrope text-body-lg font-bold text-on-surface">
              {user?.name ?? "Guest driver"}
            </p>
            <p className="truncate text-label-md font-normal text-on-surface-variant">
              {user?.email ?? "Not signed in"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat icon="directions_car" value={vehicles.length} label="Vehicles" />
          <Stat icon="assignment" value={sessions.length} label="Diagnoses" />
        </div>

        <Section title="Current vehicle">
          <Row
            icon="directions_car"
            title={vehicleLabel(currentVehicle)}
            detail="Used for every new diagnosis"
            onClick={() => navigate({ to: "/garage" })}
          />
        </Section>

        <Section title="Permissions">
          <ToggleRow
            icon="photo_camera"
            title="Camera"
            detail="Needed for photos and dashboard scans"
            checked={permissions.camera === "granted"}
            status={permissionLabel(permissions.camera)}
            onChange={(v) => void changePermission("camera", v)}
          />
          <ToggleRow
            icon="mic"
            title="Microphone"
            detail="Needed for engine recordings and live listening"
            checked={permissions.microphone === "granted"}
            status={permissionLabel(permissions.microphone)}
            onChange={(v) => void changePermission("microphone", v)}
          />
        </Section>

        <Section title="Notifications">
          <ToggleRow
            icon="notifications"
            title="Diagnosis reminders"
            detail="Nudge me to follow up on things worth monitoring"
            checked={notifications}
            onChange={(v) => dispatch({ type: "setNotifications", value: v })}
          />
        </Section>

        <div className="mt-7">
          <InfoBanner icon="shield">
            AutoAssist offers guidance based on what you share. It is not a replacement for a
            qualified mechanic, and it never claims a confirmed repair diagnosis.
          </InfoBanner>
        </div>

        <PillButton
          variant="secondary"
          className="mt-6"
          icon="logout"
          onClick={() => {
            signOut();
            dispatch({ type: "signOut" });
            toast.success("Signed out.");
            navigate({ to: "/login" });
          }}
        >
          Sign out
        </PillButton>
      </Page>
    </AppShell>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <Icon name={icon} size={20} className="text-primary" />
      <p className="mt-2 font-manrope text-headline-md text-on-surface">{value}</p>
      <p className="text-caption font-normal text-on-surface-variant">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 font-manrope text-body-lg font-bold text-on-surface">{title}</h2>
      <div className="card-shadow divide-y divide-outline-variant/60 overflow-hidden rounded-2xl bg-surface-container-lowest">
        {children}
      </div>
    </section>
  );
}

function Row({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: string;
  title: string;
  detail: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-md text-on-surface">{title}</span>
        <span className="block truncate text-caption font-normal text-on-surface-variant">
          {detail}
        </span>
      </span>
      <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
    </button>
  );
}

function ToggleRow({
  icon,
  title,
  detail,
  checked,
  status,
  onChange,
}: {
  icon: string;
  title: string;
  detail: string;
  checked: boolean;
  status?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-md text-on-surface">{title}</span>
        <span className="block text-caption font-normal text-on-surface-variant">
          {detail}
          {status ? ` · ${status}` : ""}
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function permissionLabel(state: MediaPermissionState) {
  if (state === "granted") return "Allowed";
  if (state === "limited") return "Limited";
  if (state === "denied") return "Denied";
  if (state === "prompt") return "Not requested";
  return "Unavailable";
}
