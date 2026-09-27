import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ensureAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";

const LIFETIME_SECONDS = 120;

/**
 * Draft preview. Signs a short-lived link and redirects to the public site:
 *
 *   {SITE_URL}/api/draft?path=<path>&exp=<unix seconds>&sig=<hex HMAC-SHA256 of `${path}.${exp}`>
 *
 * The key is REVALIDATE_SECRET. Only the signature ever reaches the browser.
 */
export async function GET(request: NextRequest) {
  const gate = await ensureAdmin();
  if (!gate.ok) {
    return new NextResponse(gate.error, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "";
  // A site-relative path only: no protocol-relative URLs, no backslashes.
  if (!/^\/(?![/\\])[^\s\\]*$/.test(path)) {
    return new NextResponse("A site path such as /blog/my-post is required.", { status: 400 });
  }

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return new NextResponse("REVALIDATE_SECRET is not set, so preview links cannot be signed.", { status: 500 });
  }

  const exp = Math.floor(Date.now() / 1000) + LIFETIME_SECONDS;
  const sig = createHmac("sha256", secret).update(`${path}.${exp}`).digest("hex");

  const target = new URL("/api/draft", SITE_URL);
  target.searchParams.set("path", path);
  target.searchParams.set("exp", String(exp));
  target.searchParams.set("sig", sig);

  const response = NextResponse.redirect(target, 307);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  return response;
}
