import Link from "next/link";
import { count } from "@/components/site/format";
import { Lamp } from "@/components/site/Lamp";
import type { Gallery, GalleryItem } from "@/lib/data/types";

const FRAMES = 5;

/**
 * One gallery on the index: a length of film holding its first few frames,
 * each with its title printed on the rebate. Frames nobody has shot yet are
 * unexposed. The whole strip is the way into the room: the title's link is
 * stretched over it, so there is one link per gallery, not six.
 */
export function Roll({ gallery, total, preview }: { gallery: Gallery; total: number; preview: GalleryItem[] }) {
  const frames = Array.from({ length: FRAMES }, (_, i) => preview[i] ?? null);
  const titleId = `roll-${gallery.slug}`;

  return (
    <section className="roll" aria-labelledby={titleId}>
      <div className="roll__head">
        <h2 id={titleId} className="t-h2 roll__title">
          <Link href={`/gallery/${gallery.slug}`}>{gallery.title}</Link>
        </h2>
        <p className="t-data roll__count">{total === 0 ? "Nothing hung yet" : count(total, "piece")}</p>
      </div>
      {gallery.description && <p className="roll__body">{gallery.description}</p>}

      <Lamp className="roll__lamp">
        <ol className="roll__film" aria-hidden="true">
          {frames.map((item, i) => (
            <li key={item?.id ?? `unexposed-${i}`} className="strip strip-cell">
              {item ? (
                <span className="frame strip-cell__frame">
                  {item.media_type === "video" ? (
                    <video src={item.media_url} poster={item.poster_url ?? undefined} muted playsInline preload="metadata" />
                  ) : (
                    // Gallery media is served from storage at its own size.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.media_url} alt="" loading="lazy" decoding="async" />
                  )}
                </span>
              ) : (
                <span className="frame frame--unexposed strip-cell__frame" />
              )}
              <span className="edge-print strip-cell__edge">{item ? item.title || "Untitled" : ""}</span>
            </li>
          ))}
        </ol>
      </Lamp>
    </section>
  );
}
