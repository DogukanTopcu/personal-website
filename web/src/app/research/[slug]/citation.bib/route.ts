import { getPublication, listPublications } from "@/lib/data/publications";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const publications = await listPublications();
  return publications.filter((p) => p.bibtex.trim()).map((p) => ({ slug: p.slug }));
}

/**
 * The BibTeX entry, as a downloadable file. Linked from the research list.
 * The extension lives in its own static segment, because a dynamic segment
 * that carries one (`[slug].bib`) is read as a literal folder name.
 */
export async function GET(_request: Request, ctx: RouteContext<"/research/[slug]/citation.bib">) {
  const { slug } = await ctx.params;
  const publication = await getPublication(slug);
  if (!publication?.bibtex.trim()) return new Response("Not found", { status: 404 });

  return new Response(`${publication.bibtex.trim()}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}.bib"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
