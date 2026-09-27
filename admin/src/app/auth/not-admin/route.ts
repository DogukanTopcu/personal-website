import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Pages cannot clear cookies, so a signed-in visitor who is not an admin is
 * sent here to be signed out. An actual admin is left alone, which keeps this
 * GET from being usable to log the owner out from another site.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === true) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "not_admin");
  return NextResponse.redirect(url);
}
