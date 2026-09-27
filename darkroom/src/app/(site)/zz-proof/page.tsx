// TEMPORARY verification route. Delete before hand-off.
import { Embed } from "@/components/content/Embed";
import { GalleryGrid } from "@/components/gallery/Lightbox";
import { Roll } from "@/components/gallery/Roll";
import { Shots } from "@/components/site/Shots";
import type { Gallery, GalleryItem } from "@/lib/data/types";

const base = {
  caption: "",
  created_at: "2026-01-01T00:00:00Z",
  featured: false,
  gallery_id: "g",
  meta: {},
  position: 0,
  poster_url: null,
  published_at: "2026-01-01T00:00:00Z",
  status: "published",
  tags: [],
  updated_at: "2026-01-01T00:00:00Z",
};

const pics = [
  { media_url: "/film/kordon-print.jpg", width: 2400, height: 1600, title: "Kordon at dusk", made_on: "2026-03-12" },
  { media_url: "/film/projector-poster.jpg", width: 1920, height: 1080, title: "Projector booth", made_on: "2025-11-02" },
  { media_url: "/film/projector-poster-p.jpg", width: 720, height: 900, title: "Booth, portrait study with a very long title that will not fit", made_on: null },
  { media_url: "/film/kordon-print-m.jpg", width: 1200, height: 800, title: "", made_on: "2024-06-30" },
];

const items: GalleryItem[] = Array.from({ length: 7 }, (_, i) => {
  const p = pics[i % pics.length];
  return {
    ...base,
    ...p,
    id: `item-${i}`,
    alt: p.title || "A tram on the Kordon",
    media_type: i === 5 ? "video" : "image",
    media_url: i === 5 ? "/film/projector.mp4" : p.media_url,
    poster_url: i === 5 ? "/film/projector-poster.jpg" : null,
    caption: i === 0 ? "The tram line along the Kordon, printed from a scan of the negative." : "",
    meta: i === 0 ? { Medium: "Silver gelatin print", Camera: "Olympus OM-1" } : {},
  } as unknown as GalleryItem;
});

const gallery = { id: "g", slug: "drawings", title: "Drawings", description: "Charcoal, graphite and ink.", cover_url: null, created_at: "", position: 0, updated_at: "" } as Gallery;

export default function Proof() {
  return (
    <div className="wrap section">
      <div className="rolls">
        <Roll gallery={gallery} total={items.length} preview={items.slice(0, 2)} />
      </div>
      <div style={{ height: "4rem" }} />
      <GalleryGrid items={items} />
      <div style={{ height: "4rem" }} />
      <div className="prose">
        <Embed provider="vimeo" id="123456789" title="A lesson video" />
      </div>
      <Shots
        of="Proof"
        shots={[
          { url: "/film/kordon-print-m.jpg", alt: "Tram", caption: "The dashboard, first version." },
          { url: "/film/projector-poster.jpg", alt: "Booth", caption: "A longer caption that runs across two lines to show how captions wrap in the rebate." },
          { url: "/film/kordon-print.jpg", alt: "Tram" },
          { url: "/film/projector-poster-p.jpg", alt: "Booth", caption: "Portrait crop." },
        ]}
      />
    </div>
  );
}
