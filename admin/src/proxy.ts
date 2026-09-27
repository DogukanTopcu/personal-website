import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

const LOGIN_PATH = "/login";

/**
 * Runs before every page request:
 *   1. refreshes the Supabase session and writes the new cookies,
 *   2. sends visitors without a session to /login.
 *
 * This is only the first gate. The dashboard layout, every page and every
 * Server Action call `is_admin()` themselves, and row level security has the
 * final word.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Do not run code between creating the client and this call: it is what
  // refreshes an expiring session. It also verifies the token signature.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, searchParams } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH;

  // Only navigations are redirected. A Server Action posted with an expired
  // session reaches the action, which answers with a clear error instead of
  // throwing the editor (and its unsaved text) away.
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  if (!signedIn && !isLogin && isNavigation) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/" && !pathname.startsWith("/auth/")) url.searchParams.set("next", pathname);
    return withSessionCookies(NextResponse.redirect(url), response);
  }

  if (signedIn && isLogin && isNavigation && !searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withSessionCookies(NextResponse.redirect(url), response);
  }

  return response;
}

/** A redirect must carry the refreshed (or cleared) session cookies too. */
function withSessionCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  const cacheControl = source.headers.get("cache-control");
  if (cacheControl) target.headers.set("cache-control", cacheControl);
  return target;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|woff|woff2)$).*)",
  ],
};
