"use client";

import { useEffect, useRef } from "react";
import { buildWorld } from "./world/constructions";
import { TRACK, cameraAt, copySideAt, progressAt, scrimStrengthAt, waypointViews } from "./world/flight";
import { SheetRenderer, type Camera } from "./world/renderer";

/**
 * Drives the drawing. The scroll-craft engine owns the track, the waypoint
 * events and the copy windows; everything here is page-local: the camera, the
 * draw progress and the pointer lean.
 *
 * The engine's own clip machinery is unused (there is no video on this page),
 * so the leg elements exist only to give the engine its weights and labels.
 */
export function SheetStage({ reducedMotionFallback }: { reducedMotionFallback: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce && reducedMotionFallback) return;

    const world = buildWorld();
    let renderer: SheetRenderer;
    try {
      renderer = new SheetRenderer(canvas, world);
    } catch {
      return; // no 2D context: the static sheet underneath stays visible
    }

    const root = document.documentElement;
    const host = canvas.closest("[data-sheet-host]") as HTMLElement | null;
    const stops = world.route.stops.map((s) => s.at);
    const count = world.constructions.length;

    let views: Camera[] = [];
    let viewport = { w: 0, h: 0 };
    let dirty = true;
    let raf = 0;
    let introStart = 0;
    let intro = reduce ? 1 : 0;

    // The camera is lerped, not written straight from scroll: wheel events do
    // not arrive at a constant rate and a 1:1 write reads as a stutter.
    let target = 0;
    let current = 0;
    const LERP = reduce ? 1 : 0.12;

    let leanTargetX = 0;
    let leanTargetY = 0;
    let leanX = 0;
    let leanY = 0;

    const readPalette = () => {
      const style = getComputedStyle(root);
      renderer.setPalette({
        ink: style.getPropertyValue("--ink").trim() || "#14181d",
        pencil: style.getPropertyValue("--pencil").trim() || "#5f8fe6",
        monoFont: style.getPropertyValue("--font-plex-mono").trim() || "ui-monospace, monospace",
      });
      dirty = true;
    };

    const layout = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      viewport = { w, h };
      renderer.resize(w, h, window.devicePixelRatio || 1);
      views = waypointViews(world.constructions, viewport);
      dirty = true;
    };

    const readScroll = () => {
      // Track position in viewport-heights, measured against the spacer, which
      // is what the engine sizes. Read from the host so the two agree even
      // before the engine's first layout.
      const top = host ? host.getBoundingClientRect().top + window.scrollY : 0;
      const t = (window.scrollY - top) / Math.max(window.innerHeight, 1);
      target = Math.min(TRACK, Math.max(0, t));
      dirty = true;
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      leanTargetX = (event.clientX / viewport.w - 0.5) * 14;
      leanTargetY = (event.clientY / viewport.h - 0.5) * 10;
      dirty = true;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!introStart) introStart = now;

      if (intro < 1) {
        intro = Math.min(1, (now - introStart) / 2100);
        dirty = true;
      }

      const delta = target - current;
      if (Math.abs(delta) > 0.00025) {
        current += delta * LERP;
        dirty = true;
      } else if (current !== target) {
        current = target;
        dirty = true;
      }

      const leanDx = leanTargetX - leanX;
      const leanDy = leanTargetY - leanY;
      if (Math.abs(leanDx) > 0.01 || Math.abs(leanDy) > 0.01) {
        leanX += leanDx * 0.08;
        leanY += leanDy * 0.08;
        dirty = true;
      }

      if (!dirty || !views.length) return;
      dirty = false;

      const camera = cameraAt(current, views, viewport);
      const p = progressAt(current, intro, count, stops);
      renderer.draw({ camera, ...p, leanX, leanY });

      // Published for the page's own chrome: the rail reads the position, and
      // the column scrim reads which side the copy is about to hold.
      root.style.setProperty("--sheet-t", current.toFixed(4));
      root.style.setProperty("--sheet-p", (current / TRACK).toFixed(4));
      root.style.setProperty("--copy-side", copySideAt(current).toFixed(3));
      root.style.setProperty("--scrim-strength", Math.max(0, Math.min(1, scrimStrengthAt(current))).toFixed(3));
    };

    const themeObserver = new MutationObserver(readPalette);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    schemeQuery.addEventListener("change", readPalette);

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(canvas);

    readPalette();
    layout();
    readScroll();
    if (document.fonts?.ready) document.fonts.ready.then(readPalette).catch(() => {});

    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll, { passive: true });
    if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }
    raf = requestAnimationFrame(tick);

    canvas.dataset.scReady = "true";

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      schemeQuery.removeEventListener("change", readPalette);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("pointermove", onPointer);
      root.style.removeProperty("--sheet-t");
      root.style.removeProperty("--sheet-p");
      root.style.removeProperty("--copy-side");
      root.style.removeProperty("--scrim-strength");
    };
  }, [reducedMotionFallback]);

  return (
    <canvas
      ref={canvasRef}
      className="sheet-canvas"
      aria-hidden="true"
    />
  );
}
