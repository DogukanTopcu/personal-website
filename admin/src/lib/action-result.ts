import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export type ActionFailure = { ok: false; error: string; fieldErrors?: FieldErrors };

/**
 * What every Server Action returns. `warning` is set when the write succeeded
 * but the public site could not be told about it.
 */
export type ActionResult<T = undefined> = (T extends undefined
  ? { ok: true; warning?: string }
  : { ok: true; data: T; warning?: string }) | ActionFailure;

export const REVALIDATE_WARNING = "Saved. The public site could not be refreshed.";

export function fail(error: string, fieldErrors?: FieldErrors): ActionFailure {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

/** First message per field, keyed by dotted path ("review.rating", "socials.2.url"). */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

export function invalid(error: z.ZodError): ActionFailure {
  return fail("Some fields need attention.", zodFieldErrors(error));
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const CHECK_VIOLATION = "23514";
const INSUFFICIENT_PRIVILEGE = "42501";

type DbErrorOptions = {
  /** Shown under the slug input when a unique constraint is hit. */
  uniqueMessage?: string;
  uniqueField?: string;
};

/** Turns a Postgres error into something a person can act on. */
export function dbFailure(error: PostgrestError, options: DbErrorOptions = {}): ActionFailure {
  if (error.code === UNIQUE_VIOLATION) {
    const message = options.uniqueMessage ?? "This slug is already in use. Pick another one.";
    return fail(message, { [options.uniqueField ?? "slug"]: message });
  }
  if (error.code === INSUFFICIENT_PRIVILEGE) {
    return fail("This account is not allowed to make that change.");
  }
  if (error.code === FOREIGN_KEY_VIOLATION) {
    return fail("A linked record no longer exists. Reload the page and try again.");
  }
  if (error.code === CHECK_VIOLATION) {
    return fail("The database rejected one of the values. Check the form and try again.");
  }
  return fail(error.message || "The database rejected the change.");
}

/** What a content save hands back so the editor can sync trigger-filled columns. */
export type SavedContent = {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  updated_at: string;
};
