import type { Metadata } from "next";
import { Roll } from "@/components/gallery/Roll";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { listGalleriesWithPreview } from "@/lib/data/gallery";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Drawings, photographs, digital art and interface design.",
  alternates: { canonical: "/gallery" },
};

/**
 * Every room of the gallery as a length of film with its first frames on it.
 * A room with nothing in it yet is still shown: its film is unexposed, and its
 * count says so.
 */
export default async function GalleryIndexPage() {
  const galleries = await listGalleriesWithPreview(5);

  return (
    <>
      <PageHead title="Gallery" lede="Charcoal, photographs, interfaces and things made out of data." />

      <div className="wrap section">
        {galleries.length === 0 ? (
          <Empty title="Nothing here yet" body="Drawings, photographs and interface work will appear here." />
        ) : (
          <div className="rolls">
            {galleries.map(({ gallery, count, preview }) => (
              <Roll key={gallery.id} gallery={gallery} total={count} preview={preview} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
