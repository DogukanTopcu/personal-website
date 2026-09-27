import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

type Session = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: AdminUser | null;
  isAdmin: boolean;
};

/**
 * Who is asking, and are they in `public.admins`?
 * `is_admin()` runs in the database with the caller's token, so a forged or
 * expired token can never come back true.
 */
async function readSession(): Promise<Session> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, user: null, isAdmin: false };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  return {
    supabase,
    user: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" },
    isAdmin: !error && isAdmin === true,
  };
}

/** One lookup per request, shared by the layout and the page it wraps. */
const getSession = cache(readSession);

/**
 * For layouts and pages. Returns the request's Supabase client, or leaves:
 * to /login without a session, to /auth/not-admin (which signs the visitor
 * out) when the account is not an admin.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (!session.isAdmin) redirect("/auth/not-admin");
  return { supabase: session.supabase, user: session.user };
}

export type AdminGate =
  | { ok: true; supabase: Session["supabase"]; user: AdminUser }
  | { ok: false; error: string };

/** For Server Actions and route handlers: never redirects, always answers. */
export async function ensureAdmin(): Promise<AdminGate> {
  const session = await readSession();
  if (!session.user) {
    return { ok: false, error: "Your session has ended. Sign in again in another tab, then retry." };
  }
  if (!session.isAdmin) {
    return { ok: false, error: "This account is not an admin." };
  }
  return { ok: true, supabase: session.supabase, user: session.user };
}
