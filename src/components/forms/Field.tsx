import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "../ui-kit/Icon";

export function Field({
  label,
  hint,
  error,
  icon,
  children,
  ...rest
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  icon?: string | undefined;
  children?: ReactNode | undefined;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label-md text-on-surface">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <Icon
            name={icon}
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
          />
        ) : null}
        {children ?? (
          <input
            id={id}
            {...rest}
            className={`h-14 w-full rounded-2xl border bg-surface-container-lowest text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary ${
              icon ? "pl-12 pr-4" : "px-4"
            } ${error ? "border-error" : "border-outline-variant"}`}
          />
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-caption text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-caption font-normal text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
