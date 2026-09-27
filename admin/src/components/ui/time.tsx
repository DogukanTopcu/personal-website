"use client";

import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";

type TimeProps = {
  iso: string | null | undefined;
  mode?: "date" | "datetime" | "relative";
  className?: string;
};

/**
 * Dates are rendered in the visitor's time zone, which the server does not
 * know, so the server output is corrected right after hydration.
 */
export function Time({ iso, mode = "date", className }: TimeProps) {
  const hydrated = useHydrated();
  if (!iso) return null;

  const text = !hydrated
    ? formatDate(iso)
    : mode === "relative"
      ? formatRelative(iso)
      : mode === "datetime"
        ? formatDateTime(iso)
        : formatDate(iso);

  return (
    <time dateTime={iso} title={hydrated ? formatDateTime(iso) : undefined} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
