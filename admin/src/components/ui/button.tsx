import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

export type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A square button holding only an icon. Pass an aria-label. */
  icon?: boolean;
  /** Highlighted state for toolbar toggles. */
  active?: boolean;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function buttonClass({ variant = "secondary", size = "md", icon = false }: ButtonStyleProps, className?: string) {
  return cn("btn", VARIANT_CLASS[variant], size === "sm" && "btn-sm", icon && "btn-icon", className);
}

type ButtonProps = ButtonStyleProps & Omit<ComponentProps<"button">, "type"> & { type?: "button" | "submit" | "reset" };

export function Button({ variant, size, icon, active, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, icon }, className)}
      data-active={active ? "true" : undefined}
      {...props}
    />
  );
}

type LinkButtonProps = ButtonStyleProps & ComponentProps<typeof Link>;

export function LinkButton({ variant, size, icon, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass({ variant, size, icon }, className)} {...props} />;
}

type AnchorButtonProps = ButtonStyleProps & ComponentProps<"a">;

/** For links that leave the app (the public site). */
export function AnchorButton({ variant, size, icon, className, ...props }: AnchorButtonProps) {
  return <a className={buttonClass({ variant, size, icon }, className)} {...props} />;
}
