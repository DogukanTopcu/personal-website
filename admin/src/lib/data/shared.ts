import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { CONTENT_STATUSES, type ContentStatus } from "@/lib/types";

/** Every data function takes the caller's client, so it works on the server and in the browser. */
export type DB = SupabaseClient<Database>;

export const PAGE_SIZE = 25;

export type ListParams = {
  q: string;
  status: ContentStatus | "all";
  category: string;
  page: number;
};

export type ListResult<T> = { rows: T[]; total: number; page: number; pageCount: number };

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseListParams(searchParams: SearchParams): ListParams {
  const status = first(searchParams.status);
  const page = Number.parseInt(first(searchParams.page), 10);
  return {
    q: first(searchParams.q).trim().slice(0, 120),
    status: CONTENT_STATUSES.includes(status as ContentStatus) ? (status as ContentStatus) : "all",
    category: first(searchParams.category),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function pageRange(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}

export function toListResult<T>(rows: T[] | null, count: number | null, page: number): ListResult<T> {
  const total = count ?? 0;
  return { rows: rows ?? [], total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** A contains-pattern for ILIKE with the user's own % and _ made literal. */
export function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/** Quotes a value for use inside a PostgREST `or(...)` filter string. */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, (char) => `\\${char}`)}"`;
}

/** Reads fail loudly: the route's error boundary shows the message. */
export function unwrap<T>(result: { data: T | null; error: PostgrestError | null }, what: string): T {
  if (result.error) throw new Error(`Could not load ${what}: ${result.error.message}`);
  if (result.data === null) throw new Error(`Could not load ${what}.`);
  return result.data;
}

/** An out-of-range page is not an error, it is an empty page. */
export function isRangeError(error: PostgrestError | null): boolean {
  return error?.code === "PGRST103";
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
