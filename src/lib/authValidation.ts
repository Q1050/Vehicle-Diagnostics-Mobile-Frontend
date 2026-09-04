import { ApiError } from "./api/endpoints";

export const AUTH_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  passwordMin: 8,
  passwordMax: 128,
} as const;

export type AuthField = "name" | "email" | "password" | "form";
export type AuthErrors = Partial<Record<AuthField, string>>;

export function validateSignup(values: {
  name: string;
  email: string;
  password: string;
}): AuthErrors {
  const errors: AuthErrors = {};
  const nameLength = values.name.trim().length;
  if (nameLength < AUTH_LIMITS.nameMin) errors.name = "Tell us what to call you.";
  else if (nameLength > AUTH_LIMITS.nameMax)
    errors.name = `Name must be ${AUTH_LIMITS.nameMax} characters or fewer.`;
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < AUTH_LIMITS.passwordMin) {
    errors.password = `Password must be at least ${AUTH_LIMITS.passwordMin} characters.`;
  } else if (values.password.length > AUTH_LIMITS.passwordMax) {
    errors.password = `Password must be ${AUTH_LIMITS.passwordMax} characters or fewer.`;
  }
  return errors;
}

export function readableAuthError(error: unknown): AuthErrors {
  if (!(error instanceof ApiError)) {
    return { form: "We couldn't create your account. Please try again." };
  }
  if (error.status === 0) return { form: error.message };
  if (error.status === 409) return { email: "That email is already registered." };
  if (error.status === 401) return { form: "The email or password is incorrect." };
  const details = error.details as
    { detail?: Array<{ loc?: unknown[]; msg?: string }> } | undefined;
  if (error.status === 422 && Array.isArray(details?.detail)) {
    const mapped: AuthErrors = {};
    for (const issue of details.detail) {
      const field = issue.loc?.at(-1);
      if (field === "password") mapped.password = "Password must be between 8 and 128 characters.";
      else if (field === "email") mapped.email = "Enter a valid email address.";
      else if (field === "full_name") mapped.name = "Enter a name between 2 and 120 characters.";
    }
    if (Object.keys(mapped).length) return mapped;
    return { form: "Check the highlighted account details and try again." };
  }
  return { form: error.message || "We couldn't create your account. Please try again." };
}
