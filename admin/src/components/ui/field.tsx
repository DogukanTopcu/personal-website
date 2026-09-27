"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

type FieldProps = {
  label: ReactNode;
  /** "group" when the control cannot be labelled with `htmlFor` (several inputs). */
  as?: "label" | "group";
  helper?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
  /** Something small on the right of the label, such as a character count. */
  aside?: ReactNode;
};

/**
 * Label above, control, helper and error below. The control gets an id and
 * aria wiring so screen readers read the helper and the error.
 */
export function Field({ label, as = "label", helper, error, required, className, children, aside }: FieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;

  const describedBy = [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const control =
    as === "label" && isValidElement<ControlProps>(children)
      ? cloneElement(children as ReactElement<ControlProps>, {
          id,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })
      : children;

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      role={as === "group" ? "group" : undefined}
      aria-labelledby={as === "group" ? labelId : undefined}
      aria-describedby={as === "group" ? describedBy : undefined}
    >
      <div className="flex items-baseline justify-between gap-3">
        {as === "label" ? (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        ) : (
          <span id={labelId} className="block text-[0.8125rem] font-medium leading-5 text-ink">
            {label}
            {required ? (
              <span className="ml-1 text-ink-soft" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
        )}
        {aside ? <span className="font-mono text-[0.6875rem] text-ink-soft">{aside}</span> : null}
      </div>
      {control}
      {helper ? (
        <p id={helperId} className="text-xs leading-5 text-ink-soft">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-5 text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
