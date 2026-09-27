import type { Json } from "@/lib/supabase/database.types";

export function asArray<T>(value: Json | null | undefined, guard: (v: unknown) => v is T): T[] {
  return Array.isArray(value) ? (value as unknown[]).filter(guard) : [];
}

export function asRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Logs once per message in development so a missing table or a bad key is visible. */
export function reportDataError(scope: string, error: { message: string } | null | undefined) {
  if (!error) return;
  if (process.env.NODE_ENV !== "production") console.warn(`[data] ${scope}: ${error.message}`);
}

export const nowIso = () => new Date().toISOString();
