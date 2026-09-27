"use client";

import { List, MagnifyingGlass, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BackgroundLook } from "@/lib/background";
import { NAV, SECTIONS } from "@/lib/site";
import { BackgroundPicker } from "./BackgroundPicker";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  name: string;
  /** The background options visitors may choose from; empty hides the picker. */
  backgrounds: BackgroundLook[];
  fallbackBackground: string;
};

export function SiteHeader({ name, backgrounds, fallbackBackground }: Props) {
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
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header">
      <div className="wrap site-header__bar">
        <Link className="site-header__name" href="/" aria-current={pathname === "/" ? "page" : undefined}>
          {name}
        </Link>

        <nav className="site-header__nav" aria-label="Sections">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link className="icon-btn" href="/search" aria-label="Search" title="Search">
            <MagnifyingGlass size={18} aria-hidden="true" />
          </Link>
          {backgrounds.length > 0 && <BackgroundPicker looks={backgrounds} fallbackId={fallbackBackground} />}
          <ThemeToggle />
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

      <div id="site-menu" ref={panelRef} className="site-menu" hidden={!open}>
        <nav aria-label="Sections">
          {SECTIONS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
