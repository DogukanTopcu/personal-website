"use client";

import { isoToLocalInput, localInputToIso } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { Input } from "./input";

type DateTimeFieldProps = {
  /** ISO timestamp (UTC) or null. */
  value: string | null;
  onChange: (iso: string | null) => void;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  disabled?: boolean;
};

/**
 * A datetime-local input that speaks ISO. The local value depends on the
 * browser's time zone, so it is only filled in after hydration.
 */
export function DateTimeField({ value, onChange, ...props }: DateTimeFieldProps) {
  const hydrated = useHydrated();
  return (
    <Input
      type="datetime-local"
      mono
      value={hydrated ? isoToLocalInput(value) : ""}
      onChange={(event) => onChange(localInputToIso(event.target.value))}
      {...props}
    />
  );
}
