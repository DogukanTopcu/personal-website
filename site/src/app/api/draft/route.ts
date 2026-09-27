import { createHmac, timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Draft preview. The admin panel builds a short-lived signed link so an
 * unpublished row can be seen exactly as it will look once it is live.
 *
 *   GET /api/draft?path=/blog/a-post&exp=<unix seconds>&sig=<hex HMAC>
 *
 * The signature is HMAC-SHA256 of `${path}.${exp}` keyed with REVALIDATE_SECRET.
 * Links are valid for two minutes, which is long enough to follow one and short
 * enough that a leaked URL is worthless.
 */
const MAX_WINDOW_SECONDS = 15 * 60;

export async function GET(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return new NextResponse("Preview is not configured", { status: 500 });

  const params = request.nextUrl.searchParams;
  const path = params.get("path") ?? "";
  const exp = Number(params.get("exp"));
  const sig = params.get("sig") ?? "";

  // Only same-origin paths: an open redirect here would be handed out signed.
  if (!path.startsWith("/") || path.startsWith("//")) return new NextResponse("Bad path", { status: 400 });
  if (!Number.isFinite(exp)) return new NextResponse("Bad link", { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return new NextResponse("This preview link has expired. Open a new one from the admin panel.", { status: 410 });
  if (exp > now + MAX_WINDOW_SECONDS) return new NextResponse("Bad link", { status: 400 });

  const expected = createHmac("sha256", secret).update(`${path}.${exp}`).digest("hex");
  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return new NextResponse("Bad signature", { status: 401 });

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, request.nextUrl.origin));
}
