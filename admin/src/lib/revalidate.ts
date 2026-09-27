import "server-only";

import { SITE_URL } from "@/lib/env";

/**
 * Tells the public site which pages changed:
 *
 *   POST {SITE_URL}/api/revalidate
 *   x-revalidate-secret: REVALIDATE_SECRET
 *   { "paths": ["/blog/my-post", "/blog", "/"] }
 *
 * With `{ all: true }` the site refreshes every page. Settings use it, because
 * the header and footer of every page read them. The paths are sent along
 * anyway, so a site that predates the flag still refreshes the main pages.
 *
 * REVALIDATE_EXTRA_URLS (comma separated, optional) names further copies of
 * the public site that read the same database, such as a staging deploy. They
 * are refreshed on a best-effort basis: only the main site's answer decides
 * the return value.
 *
 * Returns false instead of throwing. A site that is down must never fail a
 * save: the caller turns `false` into a warning toast.
 */
function extraSites(): string[] {
  return (process.env.REVALIDATE_EXTRA_URLS ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter((url) => /^https?:\/\//.test(url) && url !== SITE_URL.replace(/\/+$/, ""));
}

async function post(base: string, secret: string, body: { paths: string[]; all?: true }): Promise<boolean> {
  try {
    const response = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function revalidatePublic(paths: Array<string | null | undefined>, options: { all?: boolean } = {}): Promise<boolean> {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path && path.startsWith("/"))))];
  if (unique.length === 0 && !options.all) return true;

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;

  const body = options.all ? { paths: unique, all: true as const } : { paths: unique };
  const [main] = await Promise.all([post(SITE_URL, secret, body), ...extraSites().map((base) => post(base, secret, body))]);
  return main;
}
