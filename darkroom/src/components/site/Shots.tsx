import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import type { GalleryShot } from "@/lib/data/types";

/**
 * A project's own pictures as a length of film: frames side by side, each
 * caption written in the rebate under its frame. When the film is longer than
 * the page is wide it runs sideways inside itself, never the page with it.
 */
export function Shots({ shots, of }: { shots: GalleryShot[]; of: string }) {
  if (shots.length === 0) return null;

  return (
    <section className="wrap shots" aria-labelledby="shots-title">
      <h2 id="shots-title" className="t-h2 shots__title">
        Shots
      </h2>
      <div className="shots__scroll" tabIndex={0} role="region" aria-label={`Shots from ${of}, scrolls sideways`}>
        <Lamp className="shots__lamp">
          <ol className="strip shots__strip">
            {shots.map((shot) => (
              <li key={shot.url} className="shots__cell">
                <figure className="shots__figure">
                  <Frame src={shot.url} alt={shot.alt ?? ""} placeholder="Image" ratio="3 / 2" sizes="(min-width: 900px) 26rem, 78vw" />
                  {shot.caption && <figcaption className="shots__caption">{shot.caption}</figcaption>}
                </figure>
              </li>
            ))}
          </ol>
        </Lamp>
      </div>
    </section>
  );
}
