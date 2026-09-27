import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { draftMode } from "next/headers";
import type { Database } from "./database.types";

export type Db = SupabaseClient<Database>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let anonClient: Db | null = null;
let serviceClient: Db | null = null;

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } } as const;

/** Visitor client. Row level security only lets published rows through. */
export function publicDb(): Db | null {
  if (!url || !anonKey) return null;
  anonClient ??= createClient<Database>(url, anonKey, options);
  return anonClient;
}

/**
 * The client a page should read with. Normally the visitor client. In draft
 * mode (entered from the admin panel with a signed link) it is the service
 * client, so unpublished rows render exactly as they will look when live.
 */
export async function readDb(): Promise<{ db: Db | null; preview: boolean }> {
  let preview = false;
  try {
    preview = (await draftMode()).isEnabled;
  } catch {
    preview = false;
  }
  if (preview && url && serviceKey) {
    serviceClient ??= createClient<Database>(url, serviceKey, options);
    return { db: serviceClient, preview: true };
  }
  return { db: publicDb(), preview: false };
}
