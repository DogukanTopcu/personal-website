import { listPosts } from "@/lib/data/posts";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site";

export const revalidate = 900;

const escape = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string);

export async function GET() {
  const [settings, posts] = await Promise.all([getSettings(), listPosts({ limit: 30 })]);
  const base = siteUrl(settings.site_url);
  const title = settings.site_title || settings.full_name || "Personal site";
  const updated = posts[0]?.published_at ?? new Date().toISOString();

  const entries = posts
    .map((post) => {
      const url = `${base}/blog/${post.slug}`;
      return `  <entry>
    <title>${escape(post.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${new Date(post.updated_at).toISOString()}</updated>
    <published>${new Date(post.published_at ?? post.created_at).toISOString()}</published>
    <summary>${escape(post.excerpt)}</summary>
${post.category ? `    <category term="${escape(post.category.name)}"/>\n` : ""}  </entry>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escape(title)}</title>
  <subtitle>${escape(settings.site_description || settings.headline)}</subtitle>
  <link href="${base}/feed.xml" rel="self"/>
  <link href="${base}"/>
  <id>${base}/</id>
  <updated>${new Date(updated).toISOString()}</updated>
  <author><name>${escape(settings.full_name || "Doğukan Topçu")}</name></author>
${entries}
</feed>`;

  return new Response(feed, {
    headers: { "content-type": "application/atom+xml; charset=utf-8", "cache-control": "public, max-age=900, stale-while-revalidate=3600" },
  });
}
