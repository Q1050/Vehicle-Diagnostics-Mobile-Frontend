import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "onPrimary";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/92 active:bg-primary/85",
  secondary:
    "bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:bg-surface-container-highest",
  ghost: "text-primary hover:bg-primary/8 active:bg-primary/12",
  danger: "bg-error text-on-error hover:bg-error/92",
  onPrimary: "bg-white text-primary hover:bg-white/92",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-label-md",
  lg: "h-14 px-6 text-body-md font-semibold",
};

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

interface CommonProps {
  variant?: Variant | undefined;
  size?: Size | undefined;
  icon?: string | undefined;
  iconFilled?: boolean | undefined;
  children?: ReactNode | undefined;
  className?: string | undefined;
}

export function PillButton({
  variant = "primary",
  size = "lg",
  icon,
  iconFilled,
  children,
  className,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon ? <Icon name={icon} filled={iconFilled} size={20} /> : null}
      {children}
    </button>
  );
}

type LinkProps = Parameters<typeof Link>[0];

export function PillLink({
  variant = "primary",
  size = "lg",
  icon,
  iconFilled,
  children,
  className,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...(rest as LinkProps)}>
      {icon ? <Icon name={icon} filled={iconFilled} size={20} /> : null}
      {children}
    </Link>
  );
}
