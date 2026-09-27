"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Enter once on scroll: opacity plus an 8px rise, staggered in reading order.
 * Anything already on screen when the page loads is left alone, so nothing
 * that was painted by the server blinks out and back in. Fires once.
 */
export function Reveal({ children, stagger = 40, className, as: Tag = "div" }: { children: ReactNode; stagger?: number; className?: string; as?: "div" | "ul" | "ol" | "section" }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = (Array.from(host.children) as HTMLElement[]).filter((item) => item.getBoundingClientRect().top > window.innerHeight);
    const observer = new IntersectionObserver(
      (entries) => {
        // Stagger within what arrives together, not down the whole list.
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).style.setProperty("--rise-delay", `${Math.min(order++, 6) * stagger}ms`);
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    for (const item of items) {
      item.classList.add("rise");
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, [stagger]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={className}>{children}</Tag>;
}
