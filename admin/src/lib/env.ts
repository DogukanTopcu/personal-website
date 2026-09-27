/**
 * Public configuration. The NEXT_PUBLIC_ values are inlined at build time, so
 * every reference has to be a literal `process.env.NAME` expression.
 * REVALIDATE_SECRET is deliberately not here: it is read only by server
 * modules (`revalidate.ts`, the preview route).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3103").replace(/\/+$/, "");

export const MEDIA_BUCKET = "media";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
