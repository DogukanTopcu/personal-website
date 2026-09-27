/**
 * The flight plan: where the camera is, and how far each construction has been
 * drawn, for any position `t` on the scroll track. `t` is in viewport-heights,
 * the same unit the engine's leg weights are written in.
 */
import { SHEET } from "./constructions";
import type { Construction } from "./geometry";
import type { Camera } from "./renderer";

/** Leg weights. Must match `data-sc-w` on the segments in the page. */
export const LEGS = [1.0, 1.3, 1.1, 1.3, 1.2, 1.3, 1.9] as const;
export const LEG_START = LEGS.reduce<number[]>((acc, w, i) => (i === 0 ? [0] : [...acc, acc[i - 1] + LEGS[i - 1]]), []);
export const TRACK = LEGS.reduce((a, b) => a + b, 0);

const ARRIVE = 0.1; // the camera lands this far into a leg
const TRAVEL = 0.52; // scroll spent flying between two figures
const PULLBACK = 1.45; // the one long move: the last leg

/** When the camera is settled on waypoint i, and when it leaves. */
export const arriveAt = (i: number) => (i === 0 ? 0 : LEG_START[i] + ARRIVE);
export const departAt = (i: number) => (i >= LEGS.length - 2 ? LEG_START[LEGS.length - 1] - 0.42 : arriveAt(i + 1) - TRAVEL);
export const PULLBACK_END = departAt(LEGS.length - 2) + PULLBACK;

/** Where the copy sits decides where the figure may go. */
export type CopySide = "left" | "right";
export const COPY_SIDE: CopySide[] = ["left", "right", "left", "right", "left", "right"];

const smooth = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Viewport {
  w: number;
  h: number;
}

export const isNarrow = (v: Viewport) => v.w < 900 || v.w / v.h < 0.95;

function frame(target: { x: number; y: number; w: number; h: number }, region: { x0: number; y0: number; x1: number; y1: number }, v: Viewport): Camera {
  const rw = (region.x1 - region.x0) * v.w;
  const rh = (region.y1 - region.y0) * v.h;
  const scale = Math.min(rw / target.w, rh / target.h);
  const screenX = ((region.x0 + region.x1) / 2) * v.w;
  const screenY = ((region.y0 + region.y1) / 2) * v.h;
  return {
    scale,
    cx: target.x + target.w / 2 - (screenX - v.w / 2) / scale,
    cy: target.y + target.h / 2 - (screenY - v.h / 2) / scale,
  };
}

/** One settled camera per waypoint, composed for the viewport it will be seen in. */
export function waypointViews(constructions: Construction[], v: Viewport): Camera[] {
  const narrow = isNarrow(v);
  const views = constructions.map((c, i) => {
    if (narrow) return frame(c.focus, { x0: 0.06, y0: 0.1, x1: 0.94, y1: 0.47 }, v);
    return COPY_SIDE[i] === "left"
      ? frame(c.focus, { x0: 0.47, y0: 0.13, x1: 0.95, y1: 0.87 }, v)
      : frame(c.focus, { x0: 0.05, y0: 0.13, x1: 0.53, y1: 0.87 }, v);
  });
  const whole = { x: 0, y: 0, w: SHEET.w, h: SHEET.h };
  // The pull-back frames the whole sheet. The title block then sits over its
  // bottom-right corner, which is where a drawing's title block belongs.
  views.push(narrow ? frame(whole, { x0: 0.03, y0: 0.08, x1: 0.97, y1: 0.4 }, v) : frame(whole, { x0: 0.03, y0: 0.05, x1: 0.97, y1: 0.86 }, v));
  return views;
}

function mix(a: Camera, b: Camera, e: number, lift: number): Camera {
  // Zoom is interpolated in log space, with a small lift in the middle: take off, fly, land.
  const logScale = lerp(Math.log(a.scale), Math.log(b.scale), e) + Math.log(lift) * Math.sin(Math.PI * e);
  return { cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy, b.cy, e), scale: Math.exp(logScale) };
}

/**
 * Keep the frame on the sheet. Without this the camera drifts past the paper
 * during the pull-back and a third of the screen is nothing at all, which
 * reads as a broken page rather than as the authored silence before the peak.
 */
const EDGE = 140;

function onSheet(camera: Camera, v: Viewport): Camera {
  const w = v.w / camera.scale;
  const h = v.h / camera.scale;
  const clampAxis = (centre: number, span: number, extent: number) => {
    if (span >= extent + EDGE * 2) return extent / 2;
    return Math.min(Math.max(centre, span / 2 - EDGE), extent + EDGE - span / 2);
  };
  return { scale: camera.scale, cx: clampAxis(camera.cx, w, SHEET.w), cy: clampAxis(camera.cy, h, SHEET.h) };
}

export function cameraAt(t: number, views: Camera[], v: Viewport): Camera {
  const last = views.length - 1;
  for (let i = 0; i < last; i++) {
    const arrive = arriveAt(i);
    const depart = departAt(i);
    const nextArrive = i === last - 1 ? PULLBACK_END : arriveAt(i + 1);
    if (t <= depart) {
      // Settled, but never frozen: a slow push in while the figure is inked.
      const u = depart > arrive ? Math.min(1, Math.max(0, (t - arrive) / (depart - arrive))) : 0;
      const next = views[i + 1];
      return onSheet(
        {
          scale: views[i].scale * (1 + 0.045 * u),
          cx: views[i].cx + (next.cx - views[i].cx) * 0.012 * u,
          cy: views[i].cy + (next.cy - views[i].cy) * 0.012 * u,
        },
        v,
      );
    }
    if (t < nextArrive) {
      const from: Camera = {
        scale: views[i].scale * 1.045,
        cx: views[i].cx + (views[i + 1].cx - views[i].cx) * 0.012,
        cy: views[i].cy + (views[i + 1].cy - views[i].cy) * 0.012,
      };
      const e = smooth((t - depart) / (nextArrive - depart));
      return onSheet(mix(from, views[i + 1], e, i === last - 1 ? 1 : 0.86), v);
    }
  }
  // Landed on the whole sheet. A breath of drift so the end is still, not dead.
  const u = Math.min(1, Math.max(0, (t - PULLBACK_END) / Math.max(0.001, TRACK + 1 - PULLBACK_END)));
  return onSheet({ ...views[last], scale: views[last].scale * (1 + 0.012 * u) }, v);
}

export interface Progress {
  draft: number[];
  ink: number[];
  frameDraft: number;
  frameInk: number;
  route: number;
}

/**
 * `intro` runs 0..1 on a clock after load, so the first screen drafts itself
 * before the visitor has touched anything. Everything after that is the hand.
 */
export function progressAt(t: number, intro: number, count: number, routeStops: number[]): Progress {
  const draft: number[] = [];
  const ink: number[] = [];
  for (let i = 0; i < count; i++) {
    const arrive = arriveAt(i);
    const hold = Math.max(0.3, departAt(i) - arrive);
    if (i === 0) {
      draft.push(smooth(intro));
      ink.push(smooth((t - 0.03) / 0.5));
    } else {
      draft.push(smooth((t - (arrive - 0.66)) / 0.8));
      ink.push(smooth((t - (arrive + 0.02)) / (hold * 0.92)));
    }
  }

  // The route is drawn a little ahead of the camera, stop to stop.
  let route = 0;
  const lead = t + 0.3;
  if (lead >= arriveAt(count - 1)) route = lead >= arriveAt(count - 1) + 0.4 ? 1 : lerp(routeStops[count - 1], 1, (lead - arriveAt(count - 1)) / 0.4);
  else {
    for (let i = 0; i < count - 1; i++) {
      const a = arriveAt(i);
      const b = arriveAt(i + 1);
      if (lead >= a && lead < b) {
        route = lerp(routeStops[i], routeStops[i + 1], smooth((lead - a) / (b - a)));
        break;
      }
    }
  }

  return {
    draft,
    ink,
    frameDraft: smooth(intro * 1.4),
    frameInk: smooth((t - (departAt(count - 1) + 0.15)) / 1.2),
    route: Math.min(1, Math.max(0, route * smooth(intro * 1.2))),
  };
}

/**
 * Which side the copy holds, as 0 (left) to 1 (right), crossfading while the
 * camera travels. The column scrim reads this, so the paper under the copy is
 * always the side the copy is actually on.
 */
export function copySideAt(t: number): number {
  const last = LEGS.length - 1;
  const sideOf = (i: number) => (i === last ? 1 : COPY_SIDE[i] === "right" ? 1 : 0);
  for (let i = 0; i < last; i++) {
    const depart = departAt(i);
    if (t <= depart) return sideOf(i);
    const nextArrive = i === last - 1 ? PULLBACK_END : arriveAt(i + 1);
    if (t < nextArrive) {
      const e = smooth((t - depart) / (nextArrive - depart));
      return lerp(sideOf(i), sideOf(i + 1), e);
    }
  }
  return sideOf(last);
}

/**
 * How much the column scrim is needed, 1 to 0. During the pull-back the whole
 * sheet is the payoff, and a wash over half of it would throw that away: the
 * title block carries its own plate from there on.
 */
export function scrimStrengthAt(t: number): number {
  const start = departAt(LEGS.length - 2);
  return 1 - smooth((t - start) / 0.75);
}

/** Scroll position (in viewport-heights) at which waypoint i reads best. */
export function restAt(i: number): number {
  if (i === 0) return 0;
  if (i === LEGS.length - 1) return TRACK;
  return arriveAt(i) + (departAt(i) - arriveAt(i)) * 0.45;
}

/** Copy windows as fractions of the whole track, for `data-sc-window`. */
export function copyWindow(i: number): string {
  if (i === 0) return "hero";
  if (i === LEGS.length - 1) {
    const from = (PULLBACK_END - 0.62) / TRACK;
    return `${from.toFixed(4)} 1 0.4 0`;
  }
  const from = (arriveAt(i) - 0.24) / TRACK;
  const to = (departAt(i) + 0.2) / TRACK;
  return `${from.toFixed(4)} ${to.toFixed(4)} 0.3 0.3`;
}
