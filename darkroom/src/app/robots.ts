import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const base = siteUrl(settings.site_url);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/search"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
