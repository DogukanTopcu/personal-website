"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Enter once on scroll: opacity plus a 12px rise, staggered in reading order.
 * Fires once. Content that re-hides on the way back up is a defect.
 */
export function Reveal({ children, stagger = 60, className, as: Tag = "div" }: { children: ReactNode; stagger?: number; className?: string; as?: "div" | "ul" | "ol" | "section" }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const items = Array.from(host.children) as HTMLElement[];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const item of items) item.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = items.indexOf(entry.target as HTMLElement);
          (entry.target as HTMLElement).style.setProperty("--rise-delay", `${Math.min(index, 8) * stagger}ms`);
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
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
