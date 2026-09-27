import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * The admin panel calls this after every successful save so the public site
 * picks the change up without waiting for its revalidate window.
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "paths": ["/blog/a-post", "/blog", "/"] }
 *
 * `"all": true` refreshes every page instead. The admin sends it when the
 * site settings change, because the header and footer on every page read them.
 */
const MAX_PATHS = 100;

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // Compare in constant time, and only when the lengths already match:
  // timingSafeEqual throws on a length mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false, error: "Not authorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body" }, { status: 400 });
  }

  const { paths, all } = (body ?? {}) as { paths?: unknown; all?: unknown };
  if (all === true) {
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, revalidated: "all" });
  }
  if (!Array.isArray(paths)) {
    return NextResponse.json({ ok: false, error: "Expected { paths: string[] } or { all: true }" }, { status: 400 });
  }

  const cleaned = [...new Set(paths.filter((p): p is string => typeof p === "string" && p.startsWith("/") && !p.startsWith("//")))].slice(
    0,
    MAX_PATHS,
  );

  for (const path of cleaned) revalidatePath(path);

  return NextResponse.json({ ok: true, revalidated: cleaned });
}
