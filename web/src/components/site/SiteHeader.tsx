"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT_LABEL, NAV } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ wordmark, contactHref }: { wordmark: string; contactHref: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Navigating closes the menu. Derived during render rather than in an
  // effect, so the panel is never painted open on the page it navigated to.
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link className="site-header__mark" href="/">
          <span className="site-header__initials" aria-hidden="true">
            DT
          </span>
          <span className="site-header__name">{wordmark}</span>
        </Link>

        <nav className="site-header__nav" aria-label="Sections">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <ThemeToggle />
          <a className="btn site-header__cta" href={contactHref}>
            {CONTACT_LABEL}
          </a>
          <button
            ref={triggerRef}
            type="button"
            className="icon-btn site-header__burger"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      <div id="site-menu" ref={panelRef} className="site-menu" data-open={open} hidden={!open}>
        <nav aria-label="Sections">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a className="btn btn--primary" href={contactHref}>
          {CONTACT_LABEL}
        </a>
      </div>
    </header>
  );
}
