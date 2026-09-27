"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/markdown/plugins";

/**
 * Contents in the margin. It marks the heading the reader is on: the last one
 * that has passed a line a quarter of the way down the screen, or the last
 * heading of all once the page is scrolled to its end, since the final
 * sections of a short page can never reach that line.
 */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    const headings = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const atEnd = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      let current = headings[0];
      if (atEnd) {
        current = headings[headings.length - 1];
      } else {
        const line = window.innerHeight * 0.25;
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= line) current = heading;
        }
      }
      setActive(current.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [entries]);

  if (entries.length < 3) return null;

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc__title">On this page</p>
      <ol className="toc__list">
        {entries.map((entry) => (
          <li key={entry.id} data-depth={entry.depth}>
            <a href={`#${entry.id}`} aria-current={active === entry.id ? "true" : undefined}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
