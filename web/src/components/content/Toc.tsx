"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/markdown/plugins";

/** Contents in the margin. It tracks the heading the reader is actually on. */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    if (entries.length === 0) return;
    const headings = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      () => {
        // The heading nearest the top of the reading area wins, which is
        // steadier than reacting to whichever entry fired last.
        const line = window.innerHeight * 0.25;
        let current = headings[0];
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= line) current = heading;
        }
        setActive(current.id);
      },
      { rootMargin: "-25% 0px -70% 0px", threshold: [0, 1] },
    );
    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 3) return null;

  return (
    <nav className="toc" aria-label="Contents">
      <p className="toc__title">Contents</p>
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
