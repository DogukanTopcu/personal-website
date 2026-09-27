"use client";

import Script from "next/script";
import { useCallback } from "react";

type Engine = { mount: (root: Element | Document) => unknown; instances: unknown[] };

/**
 * The media query that decides between the wide gate and the tall one. The
 * poster <picture>, the gate's CSS and the clip choice all use this one query,
 * so the clip that plays is always the clip the poster was cut from.
 */
export const TALL_GATE = "(max-width: 860px) and (orientation: portrait)";

/**
 * Loads the vendored scroll-craft engine and mounts it on the screening.
 *
 * The clip is chosen here rather than by the engine's own mobile rule, which
 * also fires on any coarse pointer: a tablet held landscape would otherwise
 * play the portrait clip inside a landscape gate.
 */
export function EngineMount() {
  const onReady = useCallback(() => {
    const engine = (window as unknown as { ScrollCraft?: Engine }).ScrollCraft;
    if (!engine || engine.instances.length > 0) return;

    const tall = window.matchMedia(TALL_GATE).matches;
    for (const video of document.querySelectorAll<HTMLVideoElement>("video[data-src-wide]")) {
      const src = tall ? video.dataset.srcTall : video.dataset.srcWide;
      if (src) video.setAttribute("data-sc-src", src);
    }

    engine.mount(document.body);

    // The engine measures once at mount; one resize after load and after the
    // fonts settle keeps every act's height on the same ruler as the page.
    const relayout = () => window.dispatchEvent(new Event("resize"));
    relayout();
    document.fonts?.ready.then(relayout).catch(() => {});
    window.addEventListener("load", relayout, { once: true });
  }, []);

  return <Script src="/vendor/scrollcraft.js" strategy="afterInteractive" onReady={onReady} />;
}
