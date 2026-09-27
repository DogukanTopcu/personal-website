import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/gallery/Lightbox";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { getGallery, listGalleries } from "@/lib/data/gallery";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const galleries = await listGalleries();
  return galleries.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getGallery(slug);
  if (!found) return { title: "Not found" };
  return {
    title: found.gallery.title,
    description: found.gallery.description,
    alternates: { canonical: `/gallery/${slug}` },
  };
}

export default async function GalleryPage(props: PageProps<"/gallery/[slug]">) {
  const { slug } = await props.params;
  const found = await getGallery(slug);
  if (!found) notFound();

  const { gallery, items } = found;

  return (
    <>
      <PageHead
        crumbs={[{ href: "/gallery", label: "Gallery" }, { label: gallery.title }]}
        title={gallery.title}
        lede={gallery.description || undefined}
        meta={
          items.length > 0 && (
            <p className="t-data nums">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </p>
          )
        }
      />

      <div className="wrap section">
        {items.length === 0 ? (
          <Empty title="Nothing hung here yet" body={`Work for ${gallery.title.toLowerCase()} will appear here.`} />
        ) : (
          <GalleryGrid items={items} />
        )}
      </div>
    </>
  );
}
