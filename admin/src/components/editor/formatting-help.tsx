"use client";

import { Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SECTIONS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Text",
    rows: [
      ["**bold**  *italic*  ~~struck~~", "GitHub Flavored Markdown"],
      ["## Heading 2  ### Heading 3", "Headings start at level 2 (the page title is level 1)"],
      ["[label](https://url)", "Link"],
      ["`code`", "Inline code"],
      ["Footnote[^1] ... [^1]: Text", "Footnotes"],
    ],
  },
  {
    title: "Blocks",
    rows: [
      ["- item  1. item  - [ ] task", "Lists and task lists"],
      ["> quote", "Quote"],
      ["| a | b |", "Tables (GFM)"],
      ["---", "Horizontal rule"],
      ["```ts title=\"file.ts\" {1,3-5} showLineNumbers", "Fenced code: language, optional title, line highlights, line numbers"],
    ],
  },
  {
    title: "Callouts and disclosure",
    rows: [
      ["> [!NOTE]  > [!TIP]  > [!IMPORTANT]", "Callout box with a label"],
      ["> [!WARNING]  > [!CAUTION]", "Callouts for care"],
      [":::details[Summary]\ncontent\n:::", "Collapsible block"],
    ],
  },
  {
    title: "Math",
    rows: [
      ["$E = mc^2$", "Inline math (KaTeX)"],
      ["$$\n\\int_0^1 x\\,dx\n$$", "Display math on its own lines"],
    ],
  },
  {
    title: "Media",
    rows: [
      ["![alt](image.jpg \"Caption\")", "Image; the optional title becomes the caption"],
      ["![alt](clip.mp4)  ![alt](track.mp3)", "Video and audio players by file extension (mp4, webm, mov, m4v, mp3, wav, ogg, m4a, flac)"],
      ["https://youtu.be/ID", "A YouTube or Vimeo link alone on a line becomes an embed"],
    ],
  },
];

/** A compact reference of the site's markdown dialect. */
export function FormattingHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Formatting help">
          <Question size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Formatting</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto p-0">
        <div className="border-b border-hairline px-4 py-3">
          <p className="font-heading text-sm">Formatting help</p>
          <p className="mt-0.5 text-xs text-ink-soft">The preview renders exactly what the site renders. Raw HTML is ignored.</p>
        </div>
        {SECTIONS.map((section) => (
          <section key={section.title} className="border-b border-hairline px-4 py-3 last:border-b-0">
            <h3 className="eyebrow mb-2">{section.title}</h3>
            <dl className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {section.rows.map(([syntax, meaning]) => (
                <div key={syntax} className="contents">
                  <dt className="whitespace-pre-wrap break-words font-mono text-[0.6875rem] leading-4">{syntax}</dt>
                  <dd className="text-xs leading-4 text-ink-soft">{meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </PopoverContent>
    </Popover>
  );
}
