"use client";

import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Lamp } from "@/components/site/Lamp";
import type { GalleryItem } from "@/lib/data/types";
import { formatDate, formatDateShort } from "@/lib/format";

const titleOf = (item: GalleryItem) => item.title || "Untitled";

/**
 * The contact sheet, and the projection.
 *
 * The sheet is rows of film: every piece is a frame, with its title and date
 * printed on the rebate below it. Each frame links to the file itself, so the
 * sheet works without JavaScript. With it, a frame opens the projection
 * instead: a real dialog on black, the picture in a gate, the caption and the
 * facts in the dark beside it. Escape closes it, the arrow keys move between
 * pieces, and focus goes back to the frame that opened it.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLAnchorElement | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => {
    setOpenIndex(null);
    if (dialogRef.current?.open) dialogRef.current.close();
    openerRef.current?.focus();
  }, []);

  const move = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? null : (i + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, move]);

  // The page behind a projection does not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [isOpen]);

  const open = (index: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    // A modified click still opens the file in a new tab, as a link should.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openerRef.current = event.currentTarget;
    setOpenIndex(index);
  };

  const current = openIndex === null ? null : items[openIndex];

  return (
    <>
      <Lamp>
        <ol className="proof-sheet">
          {items.map((item, index) => {
            const title = titleOf(item);
            const edge = [title, item.media_type === "video" ? "Video" : null, item.made_on ? formatDateShort(item.made_on) : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={item.id} className="strip strip-cell">
                <a
                  className="frame strip-cell__frame proof-sheet__frame"
                  href={item.media_url}
                  onClick={open(index)}
                  aria-label={item.media_type === "video" ? `${title}, video` : undefined}
                >
                  {item.media_type === "video" ? (
                    <video src={item.media_url} poster={item.poster_url ?? undefined} muted playsInline preload="metadata" aria-hidden="true" />
                  ) : (
                    // Gallery media is served from storage at its own size.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media_url}
                      alt={item.alt || title}
                      loading="lazy"
                      decoding="async"
                      width={item.width ?? undefined}
                      height={item.height ?? undefined}
                    />
                  )}
                </a>
                <p className="edge-print strip-cell__edge">{edge}</p>
              </li>
            );
          })}
        </ol>
      </Lamp>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-labelledby="lightbox-title"
        onClose={close}
        onClick={(event) => {
          // A click on the black around the picture closes the projection.
          const target = event.target as HTMLElement;
          if (target === dialogRef.current || target.hasAttribute("data-dismiss")) close();
        }}
      >
        {current && (
          <div className="lightbox__inner" data-dismiss="">
            <button type="button" className="icon-btn lightbox__close" onClick={close}>
              <X size={22} aria-hidden="true" />
              <span className="sr-only">Close viewer</span>
            </button>

            <div className="gate lightbox__gate" data-dismiss="">
              {current.media_type === "video" ? (
                <video key={current.id} src={current.media_url} poster={current.poster_url ?? undefined} controls autoPlay playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  src={current.media_url}
                  alt={current.alt || titleOf(current)}
                  width={current.width ?? undefined}
                  height={current.height ?? undefined}
                />
              )}
            </div>

            <div className="lightbox__panel">
              <h2 id="lightbox-title" className="lightbox__title">
                {titleOf(current)}
              </h2>
              {current.caption && <p className="lightbox__caption">{current.caption}</p>}
              {(current.made_on || Object.keys(current.meta).length > 0) && (
                <dl className="facts lightbox__facts">
                  {current.made_on && (
                    <div className="facts__row">
                      <dt className="facts__key">Made</dt>
                      <dd className="facts__value">{formatDate(current.made_on)}</dd>
                    </div>
                  )}
                  {Object.entries(current.meta).map(([key, value]) => (
                    <div className="facts__row" key={key}>
                      <dt className="facts__key">{key}</dt>
                      <dd className="facts__value">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {items.length > 1 && (
                <div className="lightbox__nav">
                  <button type="button" className="btn" onClick={() => move(-1)}>
                    <ArrowLeft size={16} aria-hidden="true" /> Previous
                  </button>
                  <span className="t-data nums lightbox__count">
                    {(openIndex ?? 0) + 1} of {items.length}
                  </span>
                  <button type="button" className="btn" onClick={() => move(1)}>
                    Next <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
