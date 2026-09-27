"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT_LABEL, NAV } from "@/lib/site";

/**
 * The marquee bar. On the home page it floats in the top masking of the gate
 * and every link is a full page load: the home page runs the scroll engine,
 * which has no teardown, so it must only ever live in a document of its own.
 */
export function Bar({ wordmark, contactHref, over = false }: { wordmark: string; contactHref: string; over?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Navigating closes the menu; derived during render, not in an effect.
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const Anchor = over ? "a" : Link;

  return (
    <header className={over ? "bar bar--over" : "bar"}>
      <div className="bar__inner">
        <a className="bar__mark" href="/">
          {wordmark}
        </a>

        <nav className="bar__nav" aria-label="Sections">
          {NAV.map((item) => (
            <Anchor key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Anchor>
          ))}
        </nav>

        <div className="bar__actions">
          <a className="btn bar__cta" href={contactHref}>
            {CONTACT_LABEL}
          </a>
          <button
            ref={triggerRef}
            type="button"
            className="icon-btn bar__burger"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            <List size={22} aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      <div id="site-menu" ref={menuRef} className="menu" hidden={!open} role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" className="icon-btn menu__close" onClick={() => setOpen(false)}>
          <X size={22} aria-hidden="true" />
          <span className="sr-only">Close menu</span>
        </button>
        <a href="/">Home</a>
        {NAV.map((item) => (
          <Anchor key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
            {item.label}
          </Anchor>
        ))}
        <a className="btn btn--primary" href={contactHref}>
          {CONTACT_LABEL}
        </a>
      </div>
    </header>
  );
}
