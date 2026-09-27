"use client";

import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/data/types";
import { formatDate } from "@/lib/format";

/**
 * The grid, and a viewer for one piece at a time. The viewer is a real dialog:
 * focus is trapped by the browser, Escape closes it, arrows move between
 * pieces, and focus returns to the thumbnail that opened it.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

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

  const current = openIndex === null ? null : items[openIndex];
  const wide = (item: GalleryItem) => Boolean(item.width && item.height && item.width / item.height > 1.6);

  return (
    <>
      <ul className="gallery-grid">
        {items.map((item, index) => (
          <li key={item.id} data-wide={wide(item) ? "true" : undefined}>
            <button
              type="button"
              className="gallery-grid__item"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpenIndex(index);
              }}
            >
              {item.media_type === "video" ? (
                <video src={item.media_url} poster={item.poster_url ?? undefined} muted playsInline preload="metadata" aria-hidden="true" />
              ) : (
                // Gallery media is served from storage at its own size, so a
                // plain img keeps the intrinsic ratio the grid lays out from.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.media_url}
                  alt={item.alt || item.title || "Untitled"}
                  loading="lazy"
                  decoding="async"
                  width={item.width ?? undefined}
                  height={item.height ?? undefined}
                />
              )}
              <span className="gallery-grid__caption">
                {item.title || "Untitled"}
                {item.media_type === "video" && <span className="gallery-grid__kind">Video</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={close}
        onClick={(event) => event.target === dialogRef.current && close()}
        aria-label="Gallery viewer"
      >
        {current && (
          <div className="lightbox__inner">
            <div className="lightbox__media">
              {current.media_type === "video" ? (
                <video src={current.media_url} poster={current.poster_url ?? undefined} controls autoPlay playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.media_url} alt={current.alt || current.title || "Untitled"} />
              )}
            </div>

            <div className="lightbox__panel">
              <div className="lightbox__head">
                <p className="lightbox__title">{current.title || "Untitled"}</p>
                <button type="button" className="icon-btn" onClick={close} aria-label="Close viewer">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
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
                  <span className="t-data nums">
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
