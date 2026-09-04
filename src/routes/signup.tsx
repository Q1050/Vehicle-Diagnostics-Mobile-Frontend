import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Page } from "@/components/layout/AppShell";
import { Field } from "@/components/forms/Field";
import { PillButton } from "@/components/ui-kit/PillButton";
import { Icon } from "@/components/ui-kit/Icon";
import { signUp } from "@/lib/api/auth";
import { useStore } from "@/state/store";
import { AUTH_LIMITS, readableAuthError, validateSignup } from "@/lib/authValidation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your AutoAssist account" },
      {
        name: "description",
        content:
          "Create an AutoAssist account to save your vehicles, evidence and past diagnoses in one place.",
      },
      { property: "og:title", content: "Create your AutoAssist account" },
      {
        property: "og:description",
        content: "Save your vehicles, evidence and past diagnoses in one place.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit() {
    const next = validateSignup(form);
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await signUp(form.name, form.email, form.password);
      dispatch({ type: "signIn", user });
      dispatch({ type: "onboarded" });
      navigate({ to: "/vehicle-setup" });
    } catch (error) {
      const mapped = readableAuthError(error);
      setErrors(mapped);
      if (mapped.form) toast.error(mapped.form);
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
        <h1 className="mt-6 font-manrope text-headline-lg text-on-surface">Create your account</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Your vehicles, recordings and past diagnoses stay together so patterns are easy to spot.
        </p>

        <div className="mt-8 space-y-4">
          <Field
            label="Name"
            icon="person"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={form.name}
            onChange={set("name")}
            error={errors["name"]}
          />
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            icon="mail"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors["email"]}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            icon="lock"
            placeholder={`At least ${AUTH_LIMITS.passwordMin} characters`}
            value={form.password}
            onChange={set("password")}
            error={errors["password"]}
          />
        </div>

        <PillButton className="mt-8" onClick={submit} disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </PillButton>

        <p className="mt-6 text-center text-label-md font-normal text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </Page>
    </AppShell>
  );
}
