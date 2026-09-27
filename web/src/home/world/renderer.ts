/**
 * Draws the sheet on a 2D canvas through a camera.
 *
 * Two passes per construction: blue pencil (jittered, overshooting) and ink
 * (exact). Both are partial by arc length, so a progress value of 0.4 means
 * "the hand has got this far". The pencil stays faintly visible under the ink,
 * the way non-photo blue survives on a finished comics page.
 */
import { SHEET, type RouteStop, type World } from "./constructions";
import type { Construction, Rect, Stroke, StrokeKind } from "./geometry";

export interface Camera {
  cx: number;
  cy: number;
  /** CSS pixels per sheet unit */
  scale: number;
}

export interface Palette {
  ink: string;
  pencil: string;
  monoFont: string;
}

export interface FrameState {
  camera: Camera;
  /** per construction, 0..1 */
  draft: number[];
  ink: number[];
  frameDraft: number;
  frameInk: number;
  /** share of the route already flown, 0..1 */
  route: number;
  /** pointer lean in CSS pixels, applied in opposite directions to the far and near layers */
  leanX: number;
  leanY: number;
}

const INK_WIDTH: Record<StrokeKind, number> = { guide: 0, dash: 0, line: 1.5, bold: 2.5, hatch: 0.9 };
const PENCIL_WIDTH: Record<StrokeKind, number> = { guide: 0.95, dash: 0.95, line: 1.15, bold: 1.3, hatch: 0 };
const DASH = [30, 12, 5, 12];
const FAR = 0.9;
const NEAR = 1.1;

type PathSet = Partial<Record<StrokeKind, Path2D>>;

function tracePath(target: Path2D | CanvasRenderingContext2D, pts: Float32Array, upTo?: { len: Float32Array; distance: number }) {
  const n = pts.length / 2;
  target.moveTo(pts[0], pts[1]);
  if (!upTo) {
    for (let i = 1; i < n; i++) target.lineTo(pts[i * 2], pts[i * 2 + 1]);
    return;
  }
  const { len, distance } = upTo;
  for (let i = 1; i < n; i++) {
    if (len[i] <= distance) {
      target.lineTo(pts[i * 2], pts[i * 2 + 1]);
      continue;
    }
    const span = len[i] - len[i - 1] || 1;
    const t = (distance - len[i - 1]) / span;
    target.lineTo(pts[i * 2 - 2] + (pts[i * 2] - pts[i * 2 - 2]) * t, pts[i * 2 - 1] + (pts[i * 2 + 1] - pts[i * 2 - 1]) * t);
    break;
  }
}

function fullPaths(strokes: Stroke[], pass: "pencil" | "ink"): PathSet {
  const set: PathSet = {};
  for (const s of strokes) {
    if (pass === "pencil" && s.kind === "hatch") continue;
    if (pass === "ink" && (s.kind === "guide" || s.kind === "dash")) continue;
    const path = (set[s.kind] ??= new Path2D());
    tracePath(path, pass === "pencil" ? s.jit : s.pts);
  }
  return set;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const local = (progress: number, s: Stroke) => clamp01((progress - s.o0) / (s.o1 - s.o0));

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class SheetRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private palette: Palette = { ink: "#14181d", pencil: "#5f8fe6", monoFont: "monospace" };
  private pencilCache = new Map<Construction, PathSet>();
  private inkCache = new Map<Construction, PathSet>();

  constructor(
    private canvas: HTMLCanvasElement,
    private world: World,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not available");
    this.ctx = ctx;
    for (const c of [...world.constructions, world.frame, world.vellum, world.route.path]) {
      this.pencilCache.set(c, fullPaths(c.strokes, "pencil"));
      this.inkCache.set(c, fullPaths(c.strokes, "ink"));
    }
  }

  setPalette(palette: Palette) {
    this.palette = palette;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(Math.max(dpr, 1), 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
  }

  /** Screen position (CSS px) of a sheet point under a camera. */
  project(camera: Camera, x: number, y: number): [number, number] {
    return [this.width / 2 + (x - camera.cx) * camera.scale, this.height / 2 + (y - camera.cy) * camera.scale];
  }

  private useLayer(camera: Camera, factor: number, leanX: number, leanY: number): Rect {
    const cx = SHEET.w / 2 + (camera.cx - SHEET.w / 2) * factor;
    const cy = SHEET.h / 2 + (camera.cy - SHEET.h / 2) * factor;
    const k = camera.scale * this.dpr;
    this.ctx.setTransform(k, 0, 0, k, (this.width / 2 + leanX) * this.dpr - cx * k, (this.height / 2 + leanY) * this.dpr - cy * k);
    const w = this.width / camera.scale;
    const h = this.height / camera.scale;
    return { x: cx - w / 2 - 60, y: cy - h / 2 - 60, w: w + 120, h: h + 120 };
  }

  draw(state: FrameState) {
    const { ctx } = this;
    const { camera } = state;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Lines thin out as the camera pulls back, but never to nothing.
    const weight = Math.min(1.2, Math.max(0.5, Math.sqrt(camera.scale / 0.5)));
    const px = weight / camera.scale;

    // far: the grid on the sheet underneath
    let view = this.useLayer(camera, FAR, -state.leanX * 0.6, -state.leanY * 0.6);
    this.grid(view, px, state.frameDraft);

    // main: the drawing itself
    view = this.useLayer(camera, 1, 0, 0);
    this.construction(this.world.frame, state.frameDraft, state.frameInk, px, view);
    this.route(state.route, px, view);
    this.world.constructions.forEach((c, i) => this.construction(c, state.draft[i] ?? 0, state.ink[i] ?? 0, px, view));

    // near: loose marks on a sheet of vellum above
    view = this.useLayer(camera, NEAR, state.leanX, state.leanY);
    this.construction(this.world.vellum, state.frameDraft, 0, px, view, 0.5);
  }

  private grid(view: Rect, px: number, alpha: number) {
    if (alpha <= 0) return;
    const { ctx } = this;
    const step = 240;
    const x0 = Math.max(210, Math.ceil(view.x / step) * step);
    const x1 = Math.min(SHEET.w - 210, view.x + view.w);
    const y0 = Math.max(210, Math.ceil(view.y / step) * step);
    const y1 = Math.min(SHEET.h - 210, view.y + view.h);
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
      ctx.moveTo(x, Math.max(210, view.y));
      ctx.lineTo(x, y1);
    }
    for (let y = y0; y <= y1; y += step) {
      ctx.moveTo(Math.max(210, view.x), y);
      ctx.lineTo(x1, y);
    }
    ctx.globalAlpha = 0.16 * alpha;
    ctx.strokeStyle = this.palette.pencil;
    ctx.lineWidth = 0.8 * px;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private route(progress: number, px: number, view: Rect) {
    if (progress <= 0) return;
    const { ctx } = this;
    const { path, stops } = this.world.route;
    const stroke = path.strokes[0];
    if (!stroke) return;
    ctx.strokeStyle = this.palette.pencil;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.1 * px;
    ctx.setLineDash(DASH);
    ctx.beginPath();
    tracePath(ctx, stroke.jit, progress >= 1 ? undefined : { len: stroke.jitLen, distance: stroke.jitTotal * progress });
    ctx.stroke();
    ctx.setLineDash([]);
    for (const stop of stops) this.routeStop(stop, progress, px, view);
    ctx.globalAlpha = 1;
  }

  private routeStop(stop: RouteStop, progress: number, px: number, view: Rect) {
    const reached = clamp01((progress - stop.at + 0.015) / 0.03);
    if (reached <= 0) return;
    if (!intersects({ x: stop.x - 80, y: stop.y - 80, w: 160, h: 160 }, view)) return;
    const { ctx } = this;
    ctx.globalAlpha = 0.75 * reached;
    ctx.lineWidth = 1.1 * px;
    ctx.beginPath();
    ctx.arc(stop.x, stop.y, 26, 0, Math.PI * 2);
    ctx.moveTo(stop.x - 46, stop.y);
    ctx.lineTo(stop.x + 46, stop.y);
    ctx.moveTo(stop.x, stop.y - 46);
    ctx.lineTo(stop.x, stop.y + 46);
    ctx.stroke();
    this.label(stop.x + 44, stop.y - 36, stop.label, 34, "left", this.palette.pencil, 0.8 * reached);
    ctx.globalAlpha = 0.7;
  }

  private construction(c: Construction, draft: number, ink: number, px: number, view: Rect, pencilAlpha = 1) {
    if (draft <= 0 && ink <= 0) return;
    if (!intersects(c.bounds, view)) return;
    const { ctx } = this;

    // ---- pencil pass
    ctx.strokeStyle = this.palette.pencil;
    if (draft >= 1 && (ink <= 0 || ink >= 1)) {
      const set = this.pencilCache.get(c)!;
      for (const kind of ["guide", "dash", "line", "bold"] as StrokeKind[]) {
        const path = set[kind];
        if (!path) continue;
        const under = ink >= 1 && (kind === "line" || kind === "bold");
        ctx.globalAlpha = (kind === "guide" || kind === "dash" ? 0.5 : under ? 0.34 : 0.88) * pencilAlpha;
        ctx.lineWidth = PENCIL_WIDTH[kind] * px;
        ctx.setLineDash(kind === "dash" ? DASH : []);
        ctx.stroke(path);
      }
    } else if (draft > 0) {
      for (const s of c.strokes) {
        if (s.kind === "hatch") continue;
        const d = local(draft, s);
        if (d <= 0) continue;
        const inked = s.kind === "line" || s.kind === "bold" ? local(ink, s) : 0;
        ctx.globalAlpha = (s.kind === "guide" || s.kind === "dash" ? 0.5 : 0.88 - 0.54 * inked) * pencilAlpha;
        ctx.lineWidth = PENCIL_WIDTH[s.kind] * px;
        ctx.setLineDash(s.kind === "dash" ? DASH : []);
        ctx.beginPath();
        tracePath(ctx, s.jit, d >= 1 ? undefined : { len: s.jitLen, distance: s.jitTotal * d });
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // ---- ink pass
    if (ink > 0) {
      ctx.strokeStyle = this.palette.ink;
      if (ink >= 1) {
        const set = this.inkCache.get(c)!;
        for (const kind of ["hatch", "line", "bold"] as StrokeKind[]) {
          const path = set[kind];
          if (!path) continue;
          ctx.globalAlpha = kind === "hatch" ? 0.78 : 1;
          ctx.lineWidth = INK_WIDTH[kind] * px;
          ctx.stroke(path);
        }
      } else {
        for (const s of c.strokes) {
          if (s.kind === "guide" || s.kind === "dash") continue;
          const i = local(ink, s);
          if (i <= 0) continue;
          ctx.globalAlpha = s.kind === "hatch" ? 0.78 : 1;
          ctx.lineWidth = INK_WIDTH[s.kind] * px;
          ctx.beginPath();
          tracePath(ctx, s.pts, i >= 1 ? undefined : { len: s.len, distance: s.total * i });
          ctx.stroke();
        }
      }
      for (const label of c.labels) {
        const a = clamp01((ink - label.at) / 0.06);
        if (a > 0) this.label(label.x, label.y, label.text, label.size, label.align, this.palette.ink, a, label.rotate);
      }
    }
    ctx.globalAlpha = 1;
  }

  private label(x: number, y: number, text: string, size: number, align: CanvasTextAlign, color: string, alpha: number, rotate?: number) {
    const { ctx } = this;
    const k = ctx.getTransform().a / this.dpr; // CSS px per unit for the current layer
    if (size * k < 6.5) return; // too small to read, leave it out rather than smear it
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `500 ${size}px ${this.palette.monoFont}`;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    if (rotate) {
      ctx.translate(x, y);
      ctx.rotate(rotate);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }
}
