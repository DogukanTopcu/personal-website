"use client";

import Script from "next/script";
import { useCallback } from "react";

type Engine = { mount: (root: Element | Document | string) => unknown };

/**
 * Loads the vendored scroll-craft engine and mounts it on the flight markup.
 * The engine owns the track (the spacer's height), the copy windows and the
 * waypoint events. The drawing, the camera and the map rail are page-local.
 */
export function FlightMount() {
  const onReady = useCallback(() => {
    const engine = (window as unknown as { ScrollCraft?: Engine }).ScrollCraft;
    if (!engine) return;
    engine.mount(document.body);

    // The spacer's height is computed once at mount from innerHeight. If that
    // read is 0 (an embedded preview, a very early load) the page has no track
    // and it fails silently, so send one resize once things have settled.
    const relayout = () => window.dispatchEvent(new Event("resize"));
    relayout();
    document.fonts?.ready.then(relayout).catch(() => {});
    window.addEventListener("load", relayout, { once: true });
  }, []);

  return <Script src="/vendor/scrollcraft.js" strategy="afterInteractive" onReady={onReady} />;
}
