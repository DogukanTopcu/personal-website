"use client";

import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A frame comes up out of the dark the first time it is seen, the way a lamp
 * comes up: brightness and opacity only, once. The dim state exists only once
 * JavaScript has run (see `.lamp` and `.no-js` in globals.css), and reduced
 * motion skips straight to the lit frame.
 *
 * Wrap media only. The lamp's filter makes it a containing block, so a link
 * stretched over a whole entry must live outside it.
 */
export function Lamp({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      el.classList.add("is-lit");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.classList.add("is-lit");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx("lamp", className)}>
      {children}
    </div>
  );
}
