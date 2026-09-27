import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { listGalleriesWithPreview } from "@/lib/data/gallery";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Drawings, photographs, digital art and interface design.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryIndexPage() {
  const galleries = await listGalleriesWithPreview(5);
  const anything = galleries.some((g) => g.count > 0);

  return (
    <>
      <PageHead title="Gallery" lede="Charcoal, photographs, interfaces and things made out of data." />

      <div className="wrap section">
        {!anything ? (
          <Empty title="Nothing here yet" body="Drawings, photographs and interface work will appear here." />
        ) : (
          <div className="gallery-index">
            {galleries.map(({ gallery, count, preview }) => (
              <section key={gallery.id} className="gallery-room">
                <div className="gallery-room__head">
                  <h2 className="t-h2">
                    <Link className="link" href={`/gallery/${gallery.slug}`}>
                      {gallery.title}
                    </Link>
                  </h2>
                  <p className="entry__aside nums">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </p>
                </div>
                {gallery.description && <p className="entry__body gallery-room__body">{gallery.description}</p>}

                {count === 0 ? (
                  <p className="t-caption gallery-room__empty">Nothing hung in this room yet.</p>
                ) : (
                  <ul className="gallery-strip">
                    {preview.map((item) => (
                      <li key={item.id}>
                        <Link className="gallery-strip__item" href={`/gallery/${gallery.slug}`}>
                          {item.media_type === "video" ? (
                            <video src={item.media_url} poster={item.poster_url ?? undefined} muted playsInline preload="metadata" aria-hidden="true" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.media_url} alt={item.alt || item.title} loading="lazy" decoding="async" />
                          )}
                        </Link>
                      </li>
                    ))}
                    {count > preview.length && (
                      <li className="gallery-strip__more">
                        <Link className="link" href={`/gallery/${gallery.slug}`}>
                          {count - preview.length} more
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
