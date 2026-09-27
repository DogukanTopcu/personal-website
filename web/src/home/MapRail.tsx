"use client";

import { useEffect, useRef, useState } from "react";
import { restAt } from "./world/flight";

/**
 * The navigation for this page. A worldflight without a map is a video: the
 * visitor has to be able to jump. Labels come from the copy, so the rail and
 * the page always agree.
 */
export function MapRail({ labels }: { labels: string[] }) {
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onWaypoint = (event: Event) => {
      const detail = (event as CustomEvent<{ index: number }>).detail;
      if (typeof detail?.index === "number") setActive(detail.index);
    };
    window.addEventListener("sc:waypoint", onWaypoint);
    return () => window.removeEventListener("sc:waypoint", onWaypoint);
  }, []);

  // Keep the active stop in view when the rail is a horizontal strip on phones.
  useEffect(() => {
    const rail = railRef.current;
    const current = rail?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!rail || !current || window.matchMedia("(min-width: 900px)").matches) return;
    const list = rail.querySelector(".map-rail__list");
    if (!list) return;
    const target = current.offsetLeft - list.clientWidth / 2 + current.offsetWidth / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  const goTo = (index: number) => {
    const host = document.querySelector<HTMLElement>("[data-sheet-host]");
    const top = host ? host.getBoundingClientRect().top + window.scrollY : 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + restAt(index) * window.innerHeight, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav ref={railRef} className="map-rail" aria-label="Sheet waypoints">
      <ol className="map-rail__list">
        {labels.map((label, index) => (
          <li key={label}>
            <button type="button" className="map-rail__stop" aria-current={index === active} onClick={() => goTo(index)}>
              <span className="map-rail__tick" aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
