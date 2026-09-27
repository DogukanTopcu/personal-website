/**
 * Geometry for the home page sheet.
 *
 * Everything on the sheet is a polyline. Each stroke exists twice: the exact
 * points (the ink pass) and a jittered, slightly overshooting copy (the blue
 * pencil pass). A construction draws its strokes in the order they were
 * authored, which is the order a draughtsman would: guides first, outlines
 * next, hatching last.
 */

export type StrokeKind =
  | "guide" // blue pencil only, never inked
  | "dash" // blue pencil centre line (dash-dot), never inked
  | "line" // drafted in blue, then inked
  | "bold" // drafted in blue, then inked heavier
  | "hatch"; // ink only, thin

export type Point = [number, number];

export interface Stroke {
  kind: StrokeKind;
  /** exact points, flat [x0, y0, x1, y1, ...] */
  pts: Float32Array;
  /** pencil points: subdivided, jittered, overshooting */
  jit: Float32Array;
  /** cumulative length at each exact point */
  len: Float32Array;
  /** cumulative length at each pencil point */
  jitLen: Float32Array;
  total: number;
  jitTotal: number;
  /** draw window inside the construction's own 0..1 timeline */
  o0: number;
  o1: number;
}

export interface Label {
  x: number;
  y: number;
  text: string;
  size: number;
  align: "left" | "center" | "right";
  /** point on the construction timeline at which the label appears */
  at: number;
  rotate?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Construction {
  id: string;
  /** the rectangle the camera frames for this waypoint */
  focus: Rect;
  /** everything drawn, for culling */
  bounds: Rect;
  strokes: Stroke[];
  labels: Label[];
}

/** Small, fast, seedable. The sheet must look the same on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JITTER = 1.5; // sheet units, perpendicular wobble of a pencil line
const STEP = 26; // subdivision length for the pencil pass
const OVERSHOOT: Record<StrokeKind, number> = { guide: 0, dash: 0, line: 11, bold: 14, hatch: 0 };

function cumulative(pts: Float32Array): { len: Float32Array; total: number } {
  const n = pts.length / 2;
  const len = new Float32Array(n);
  let acc = 0;
  for (let i = 1; i < n; i++) {
    acc += Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
    len[i] = acc;
  }
  return { len, total: acc };
}

function pencilCopy(points: Point[], kind: StrokeKind, closed: boolean, rand: () => number): Float32Array {
  const src = points.slice();
  const over = closed ? 0 : OVERSHOOT[kind];

  // A draughtsman's line runs a little past the corner it is aiming for.
  if (over > 0 && src.length >= 2) {
    const [ax, ay] = src[0];
    const [bx, by] = src[1];
    const d0 = Math.hypot(bx - ax, by - ay) || 1;
    const s0 = over * (0.6 + rand() * 0.8);
    src[0] = [ax - ((bx - ax) / d0) * s0, ay - ((by - ay) / d0) * s0];
    const [cx, cy] = src[src.length - 2];
    const [dx, dy] = src[src.length - 1];
    const d1 = Math.hypot(dx - cx, dy - cy) || 1;
    const s1 = over * (0.6 + rand() * 0.8);
    src[src.length - 1] = [dx + ((dx - cx) / d1) * s1, dy + ((dy - cy) / d1) * s1];
  }

  const out: number[] = [];
  // Low frequency wobble: a slow random walk, so the line bows rather than shivers.
  let drift = (rand() - 0.5) * JITTER;
  for (let i = 0; i < src.length - 1; i++) {
    const [x0, y0] = src[i];
    const [x1, y1] = src[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(d / STEP));
    const nx = d ? -(y1 - y0) / d : 0;
    const ny = d ? (x1 - x0) / d : 0;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      drift = drift * 0.72 + (rand() - 0.5) * JITTER * 0.9;
      const edge = i === 0 && s === 0 ? 0.35 : 1;
      out.push(x0 + (x1 - x0) * t + nx * drift * edge, y0 + (y1 - y0) * t + ny * drift * edge);
    }
  }
  const last = src[src.length - 1];
  out.push(last[0], last[1]);
  return Float32Array.from(out);
}

export class Pen {
  readonly strokes: Stroke[] = [];
  readonly labels: Label[] = [];
  private rand: () => number;
  private minX = Infinity;
  private minY = Infinity;
  private maxX = -Infinity;
  private maxY = -Infinity;

  constructor(
    readonly id: string,
    readonly focus: Rect,
    seed: number,
  ) {
    this.rand = mulberry32(seed);
  }

  random() {
    return this.rand();
  }

  poly(points: Point[], kind: StrokeKind = "line", closed = false): this {
    if (points.length < 2) return this;
    const all = closed ? [...points, points[0]] : points;
    const pts = Float32Array.from(all.flat());
    const { len, total } = cumulative(pts);
    if (total < 0.5) return this;
    const jit = kind === "hatch" ? pts : pencilCopy(all, kind, closed, this.rand);
    const j = kind === "hatch" ? { len, total } : cumulative(jit);
    this.strokes.push({ kind, pts, jit, len, jitLen: j.len, total, jitTotal: j.total, o0: 0, o1: 1 });
    for (const [x, y] of all) {
      if (x < this.minX) this.minX = x;
      if (y < this.minY) this.minY = y;
      if (x > this.maxX) this.maxX = x;
      if (y > this.maxY) this.maxY = y;
    }
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, kind: StrokeKind = "line"): this {
    return this.poly(
      [
        [x1, y1],
        [x2, y2],
      ],
      kind,
    );
  }

  /** Four separate lines, so the pencil pass overshoots every corner. */
  rect(x: number, y: number, w: number, h: number, kind: StrokeKind = "line"): this {
    this.line(x, y, x + w, y, kind);
    this.line(x + w, y, x + w, y + h, kind);
    this.line(x + w, y + h, x, y + h, kind);
    this.line(x, y + h, x, y, kind);
    return this;
  }

  arcPoints(cx: number, cy: number, r: number, a0: number, a1: number): Point[] {
    const sweep = a1 - a0;
    const n = Math.max(6, Math.ceil((Math.abs(sweep) * r) / 22));
    const out: Point[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (sweep * i) / n;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }

  arc(cx: number, cy: number, r: number, a0: number, a1: number, kind: StrokeKind = "line"): this {
    return this.poly(this.arcPoints(cx, cy, r, a0, a1), kind);
  }

  circle(cx: number, cy: number, r: number, kind: StrokeKind = "line"): this {
    const start = this.rand() * Math.PI * 2;
    return this.poly(this.arcPoints(cx, cy, r, start, start + Math.PI * 2).slice(0, -1), kind, true);
  }

  /** Centre mark: a small cross. */
  cross(cx: number, cy: number, size = 26, kind: StrokeKind = "guide"): this {
    this.line(cx - size, cy, cx + size, cy, kind);
    this.line(cx, cy - size, cx, cy + size, kind);
    return this;
  }

  /**
   * Hatch any set of closed contours with parallel lines (even-odd rule, so a
   * contour inside another one is a hole).
   */
  hatch(contours: Point[][], angle: number, gap: number): this {
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const rot = contours.map((c) => c.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos] as Point));
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of rot) {
      for (const [, y] of c) {
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    }
    const back = (x: number, y: number): Point => [x * cos + y * sin, -x * sin + y * cos];

    let flip = false;
    for (let y = lo + gap * 0.6; y < hi; y += gap) {
      const xs: number[] = [];
      for (const c of rot) {
        for (let i = 0; i < c.length; i++) {
          const [x0, y0] = c[i];
          const [x1, y1] = c[(i + 1) % c.length];
          if (y0 <= y === y1 <= y) continue;
          xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        if (xs[i + 1] - xs[i] < 4) continue;
        // Alternate direction, the way a hand moves back and forth.
        const a = back(flip ? xs[i + 1] : xs[i], y);
        const b = back(flip ? xs[i] : xs[i + 1], y);
        this.poly([a, b], "hatch");
      }
      flip = !flip;
    }
    return this;
  }

  text(x: number, y: number, text: string, size = 30, align: Label["align"] = "left", rotate?: number): this {
    // `at` is filled in by finish(): a label appears when the strokes authored before it are inked.
    this.labels.push({ x, y, text, size, align, at: this.strokes.length, rotate });
    return this;
  }

  /** Dimension line with extension lines, arrowheads and a label. */
  dimension(x1: number, y1: number, x2: number, y2: number, offset: number, label: string, size = 30): this {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / d;
    const uy = (y2 - y1) / d;
    const nx = -uy;
    const ny = ux;
    const ax = x1 + nx * offset;
    const ay = y1 + ny * offset;
    const bx = x2 + nx * offset;
    const by = y2 + ny * offset;
    const gap = Math.sign(offset) * 14;
    const ext = Math.sign(offset) * 22;

    this.line(x1 + nx * gap, y1 + ny * gap, ax + nx * ext, ay + ny * ext, "line");
    this.line(x2 + nx * gap, y2 + ny * gap, bx + nx * ext, by + ny * ext, "line");
    this.line(ax, ay, bx, by, "line");
    const head = 26;
    const wide = 7;
    this.poly(
      [
        [ax, ay],
        [ax + ux * head + nx * wide, ay + uy * head + ny * wide],
        [ax + ux * head - nx * wide, ay + uy * head - ny * wide],
      ],
      "line",
      true,
    );
    this.poly(
      [
        [bx, by],
        [bx - ux * head + nx * wide, by - uy * head + ny * wide],
        [bx - ux * head - nx * wide, by - uy * head - ny * wide],
      ],
      "line",
      true,
    );

    const horizontal = Math.abs(uy) < 0.2;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    if (horizontal) this.text(mx, my - 16, label, size, "center");
    else this.text(mx - 18, my, label, size, "center", -Math.PI / 2);
    return this;
  }

  /** Leader: a short line from a point to a label. */
  leader(fromX: number, fromY: number, toX: number, toY: number, label: string, size = 28, align: Label["align"] = "left"): this {
    const shelf = align === "left" ? 46 : -46;
    this.poly(
      [
        [fromX, fromY],
        [toX, toY],
        [toX + shelf, toY],
      ],
      "line",
    );
    this.circle(fromX, fromY, 5, "line");
    this.text(toX + shelf + (align === "left" ? 12 : -12), toY + size * 0.34, label, size, align);
    return this;
  }

  finish(): Construction {
    const n = this.strokes.length;
    const totalLength = this.strokes.reduce((sum, s) => sum + s.total, 0) || 1;
    const SPAN = 0.24; // every stroke takes this share of the timeline to draw
    let acc = 0;
    const startOf: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = this.strokes[i];
      s.o0 = (acc / totalLength) * (1 - SPAN);
      s.o1 = s.o0 + SPAN;
      startOf.push(s.o0);
      acc += s.total;
    }
    for (const label of this.labels) {
      const index = Math.min(Math.max(label.at - 1, 0), n - 1);
      label.at = n ? Math.min(0.98, (startOf[index] ?? 0) + SPAN * 0.8) : 0;
    }
    const pad = 40;
    return {
      id: this.id,
      focus: this.focus,
      bounds: {
        x: this.minX - pad,
        y: this.minY - pad,
        w: this.maxX - this.minX + pad * 2,
        h: this.maxY - this.minY + pad * 2,
      },
      strokes: this.strokes,
      labels: this.labels,
    };
  }
}

/** Parts of segment a-b that lie outside a convex polygon (for one sheet lying on another). */
export function outsideConvex(a: Point, b: Point, polygon: Point[]): [Point, Point][] {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  // Orientation, so the inward normal test works for either winding.
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % polygon.length];
    area += x0 * y1 - x1 * y0;
  }
  const sign = area > 0 ? 1 : -1;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % polygon.length];
    const nx = -(y1 - y0) * sign;
    const ny = (x1 - x0) * sign;
    const denom = nx * dx + ny * dy;
    const dist = nx * (a[0] - x0) + ny * (a[1] - y0);
    if (Math.abs(denom) < 1e-9) {
      if (dist < 0) return [[a, b]];
      continue;
    }
    const t = -dist / denom;
    if (denom > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return [[a, b]];
  }
  const at = (t: number): Point => [a[0] + dx * t, a[1] + dy * t];
  const out: [Point, Point][] = [];
  if (t0 > 0.001) out.push([a, at(t0)]);
  if (t1 < 0.999) out.push([at(t1), b]);
  return out;
}

export function rotatedRect(cx: number, cy: number, w: number, h: number, angle: number): Point[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return (
    [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ] as Point[]
  ).map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

/** Catmull-Rom through the given points, flattened. */
export function spline(points: Point[], perSegment = 28): Point[] {
  if (points.length < 3) return points;
  const p = [points[0], ...points, points[points.length - 1]];
  const out: Point[] = [];
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
