"use client";

import { Play } from "@phosphor-icons/react";
import { useState } from "react";

type Props = { provider: "youtube" | "vimeo"; id: string; title?: string };

/**
 * Click to load. No third party request is made until the reader asks for the
 * video, which keeps the page light and the reader untracked. The picture sits
 * in a gate and its title sits below it, in the masking, never on the picture.
 */
export function Embed({ provider, id, title }: Props) {
  const [active, setActive] = useState(false);
  const label = title || (provider === "youtube" ? "YouTube video" : "Vimeo video");
  const src =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&dnt=1`;

  return (
    <figure className="embed-figure">
      <div className="embed gate">
        {active ? (
          <iframe
            src={src}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <>
            {provider === "youtube" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="embed__poster"
              />
            )}
            <button type="button" className="embed__play" onClick={() => setActive(true)}>
              <span className="embed__mark" aria-hidden="true">
                <Play size={22} weight="fill" />
              </span>
              <span className="sr-only">Play: {label}</span>
            </button>
          </>
        )}
      </div>
      <figcaption className="embed__caption">{label}</figcaption>
    </figure>
  );
}
