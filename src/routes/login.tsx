import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Field } from "@/components/forms/Field";
import { PillButton } from "@/components/ui-kit/PillButton";
import { Icon } from "@/components/ui-kit/Icon";
import { signIn } from "@/lib/api/auth";
import { listVehicles } from "@/lib/api/vehicles";
import { useStore } from "@/state/store";
import { readableAuthError } from "@/lib/authValidation";
import { rememberedAccount } from "@/lib/api/session-storage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AutoAssist" },
      {
        name: "description",
        content: "Sign in to AutoAssist to pick up your vehicle diagnoses where you left off.",
      },
      { property: "og:title", content: "Sign in — AutoAssist" },
      {
        property: "og:description",
        content: "Pick up your vehicle diagnoses where you left off.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => rememberedAccount.getEmail());
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Passwords are at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await signIn(email, password);
      dispatch({ type: "signIn", user });
      const vehicles = await listVehicles();
      dispatch({ type: "setVehicles", vehicles });
      dispatch({ type: "onboarded" });
      navigate({ to: vehicles.length ? "/home" : "/vehicle-setup" });
    } catch (error) {
      const mapped = readableAuthError(error);
      toast.error(mapped.form ?? mapped.email ?? "We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Page className="flex min-h-dvh flex-col pt-14">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-on-primary">
          <Icon name="car_repair" size={28} />
        </div>
        <h1 className="mt-6 font-manrope text-headline-lg text-on-surface">Welcome back</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Sign in to continue your diagnoses and keep your garage up to date.
        </p>

        <div className="mt-8 space-y-4">
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            icon="mail"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </div>

        <PillButton className="mt-8" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </PillButton>

        <p className="mt-6 text-center text-label-md font-normal text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </Page>
    </AppShell>
  );
}
