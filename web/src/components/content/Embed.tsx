"use client";

import { Play } from "@phosphor-icons/react";
import { useState } from "react";

type Props = { provider: "youtube" | "vimeo"; id: string; title?: string };

/**
 * Click to load. No third party request is made until the reader asks for the
 * video, which keeps the page light and the reader untracked.
 */
export function Embed({ provider, id, title }: Props) {
  const [active, setActive] = useState(false);
  const label = title || (provider === "youtube" ? "YouTube video" : "Vimeo video");
  const src =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&dnt=1`;

  if (active) {
    return (
      <div className="embed">
        <iframe
          src={src}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="embed">
      {provider === "youtube" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group absolute inset-0 flex items-end justify-between gap-4 p-4 text-left sm:p-6"
        style={{ background: "linear-gradient(to top, rgb(12 20 34 / 0.78), rgb(12 20 34 / 0.12) 55%)" }}
        aria-label={`Play: ${label}`}
      >
        <span className="max-w-[70%] text-sm font-medium leading-snug text-[#f8faff] sm:text-base">{label}</span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#f8faff] text-[#f8faff] transition-colors duration-200 group-hover:bg-[#f8faff] group-hover:text-[#0c1422]">
          <Play size={20} weight="fill" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
