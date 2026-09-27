import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const STORAGE_PATH = "/storage/v1/object/public/**";

/**
 * Media lives in Supabase Storage. The host comes from the project URL, and
 * the local stack (supabase start) is always allowed.
 */
function storagePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "http", hostname: "127.0.0.1", pathname: STORAGE_PATH },
    { protocol: "http", hostname: "localhost", pathname: STORAGE_PATH },
  ];

  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return patterns;

  try {
    const url = new URL(raw);
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (!isLocal) {
      patterns.push({
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname: url.hostname,
        port: url.port,
        pathname: STORAGE_PATH,
      });
    }
  } catch {
    // A malformed URL is reported by the Supabase client at runtime.
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: storagePatterns(),
  },
  experimental: {
    serverActions: {
      // Long lessons and chapters travel through Server Actions as markdown.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
