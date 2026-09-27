"use client";

import { Check, ImageSquare } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { applyBackground, BACKGROUND_STORAGE_KEY, cssUrl, NO_BACKGROUND, type BackgroundLook } from "@/lib/background";

/**
 * The visitor's choice of background. The inline script in the root layout has
 * already painted one and written its id to <html data-bg-id>; this reads that
 * attribute rather than keeping its own copy, like the theme toggle does.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bg-id"] });
  return () => observer.disconnect();
}

export function BackgroundPicker({ looks, fallbackId }: { looks: BackgroundLook[]; fallbackId: string }) {
  const current = useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute("data-bg-id") ?? fallbackId,
    () => fallbackId,
  );
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    wrapRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const choose = (id: string) => {
    applyBackground(looks.find((look) => look.id === id) ?? null);
    try {
      // Choosing the site's own default forgets the choice, so a later change
      // of default in the admin reaches this visitor too.
      if (id === fallbackId) localStorage.removeItem(BACKGROUND_STORAGE_KEY);
      else localStorage.setItem(BACKGROUND_STORAGE_KEY, id);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
  };

  const options = [{ id: NO_BACKGROUND, name: "None", look: null as BackgroundLook | null }, ...looks.map((look) => ({ id: look.id, name: look.name, look }))];

  return (
    <div ref={wrapRef} className="bg-picker">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Background"
        title="Background"
        onClick={() => setOpen((value) => !value)}
      >
        <ImageSquare size={18} aria-hidden="true" />
      </button>

      <div id={panelId} className="bg-picker__panel" hidden={!open}>
        <fieldset className="bg-picker__set">
          <legend className="bg-picker__legend">Background</legend>
          {options.map((option) => {
            // Thumbnails are CSS backgrounds inside a hidden panel, so their
            // pictures load only once someone opens it.
            const style = option.look
              ? ({ "--thumb-light": cssUrl(option.look.light), ...(option.look.dark ? { "--thumb-dark": cssUrl(option.look.dark) } : {}) } as CSSProperties)
              : undefined;
            return (
              <label key={option.id} className="bg-picker__option">
                <input
                  className="sr-only"
                  type="radio"
                  name="background"
                  value={option.id}
                  checked={current === option.id}
                  onChange={() => choose(option.id)}
                />
                <span className="bg-picker__thumb" style={style} aria-hidden="true" />
                <span className="bg-picker__name">{option.name}</span>
                <Check className="bg-picker__check" size={16} aria-hidden="true" />
              </label>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}
