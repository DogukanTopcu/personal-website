/**
 * The sheet: seven constructions on one ISO-proportioned drawing.
 *
 * Every figure is geometric on purpose. The only figurative drawings on this
 * site are the owner's own, in the gallery. Every number printed on the sheet
 * is one the owner stated (seven years, three years, 2026).
 */
import { Pen, outsideConvex, rotatedRect, spline, type Construction, type Point, type Rect } from "./geometry";

export const SHEET = { w: 7200, h: 5090 } as const;

export const WAYPOINTS = ["Title", "Profile", "Research", "Work", "Writing", "Gallery", "Sheet"] as const;

/**
 * Where each figure sits on the sheet. Laid out so the pull-back reads as one
 * composed drawing, and so the bottom-right stays empty: that is where the
 * title block goes, which is where a real drawing keeps it.
 */
const FOCUS: Rect[] = [
  { x: 560, y: 500, w: 1900, h: 1420 },   // title     top-left
  { x: 2880, y: 480, w: 2320, h: 1530 },  // profile   top-middle
  { x: 5420, y: 430, w: 1480, h: 1780 },  // research  top-right
  { x: 2500, y: 2420, w: 1830, h: 1300 }, // work      middle
  { x: 380, y: 2380, w: 1780, h: 1520 },  // writing   middle-left
  { x: 2020, y: 3820, w: 2230, h: 1020 }, // gallery   bottom-middle
];

const TAU = Math.PI * 2;
const iso = (cx: number, cy: number, x: number, y: number, z: number): Point => [
  cx + (x - y) * 0.866,
  cy + (x + y) * 0.5 - z,
];

// ---------------------------------------------------------------- 0 title --
function monogram(): Construction {
  const f = FOCUS[0];
  const pen = new Pen("title", f, 11);
  const H = 1000;
  const s = 210; // stroke of the letters
  const base = f.y + 1240;
  const cap = base - H;
  const dX = f.x + 190;
  const bowl = dX + 270;
  const R = H / 2;
  const tX = bowl + R + 170;
  const tW = 800;
  const midY = cap + R;

  // guides: the lettering grid
  pen.line(f.x - 60, cap, f.x + f.w + 40, cap, "guide");
  pen.line(f.x - 60, base, f.x + f.w + 40, base, "guide");
  pen.line(f.x - 60, midY, f.x + f.w + 40, midY, "dash");
  for (const x of [dX, dX + s, bowl, bowl + R, tX, tX + tW / 2 - s / 2, tX + tW / 2 + s / 2, tX + tW]) {
    pen.line(x, cap - 130, x, base + 110, "guide");
  }
  pen.circle(bowl, midY, R, "guide");
  pen.circle(bowl, midY, R - s, "guide");
  pen.cross(bowl, midY, 34);
  pen.line(bowl - R * 0.9, midY + R * 0.9, bowl + R * 0.9, midY - R * 0.9, "guide");
  pen.cross(tX + tW / 2, cap + s / 2, 26);

  // outlines
  const outerD: Point[] = [[dX, cap], [bowl, cap], ...pen.arcPoints(bowl, midY, R, -Math.PI / 2, Math.PI / 2).slice(1), [dX, base]];
  const innerD: Point[] = [
    [dX + s, cap + s],
    [bowl, cap + s],
    ...pen.arcPoints(bowl, midY, R - s, -Math.PI / 2, Math.PI / 2).slice(1),
    [dX + s, base - s],
  ];
  const tee: Point[] = [
    [tX, cap],
    [tX + tW, cap],
    [tX + tW, cap + s],
    [tX + tW / 2 + s / 2, cap + s],
    [tX + tW / 2 + s / 2, base],
    [tX + tW / 2 - s / 2, base],
    [tX + tW / 2 - s / 2, cap + s],
    [tX, cap + s],
  ];
  pen.poly(outerD, "bold", true);
  pen.poly(innerD, "bold", true);
  pen.poly(tee, "bold", true);

  // dimensions: proportions, not invented measurements
  pen.dimension(dX, base, dX, cap, 150, "H");
  pen.dimension(tX + tW / 2 - s / 2, base, tX + tW / 2 + s / 2, base, 120, "0.21 H");

  // fill
  pen.hatch([outerD, innerD], Math.PI / 4, 30);
  pen.hatch([tee], Math.PI / 4, 30);
  return pen.finish();
}

// -------------------------------------------------------------- 1 profile --
function durations(): Construction {
  const f = FOCUS[1];
  const pen = new Pen("profile", f, 23);
  const x0 = f.x + 200;
  const unit = 250; // one year
  const barH = 190;
  const yA = f.y + 430;
  const yB = yA + 330;
  const axis = yB + barH + 90;
  const right = x0 + unit * 7;

  // set out: the year grid, then the axis
  for (let i = 0; i <= 7; i++) pen.line(x0 + unit * i, f.y + 250, x0 + unit * i, axis + 40, "guide");
  pen.line(x0 - 90, yA + barH / 2, right + 150, yA + barH / 2, "dash");
  pen.line(x0 - 90, yB + barH / 2, right + 150, yB + barH / 2, "dash");
  pen.line(x0 - 60, axis, right + 150, axis, "line");
  for (let i = 0; i <= 7; i++) {
    const x = x0 + unit * i;
    pen.line(x, axis, x, axis + (i % 2 === 0 ? 42 : 24), "line");
    if (i % 2 === 0) pen.text(x, axis + 108, `+${i}`, 40, "center");
  }
  pen.text(right + 150, axis + 108, "years", 40, "right");

  // seven years of building software
  pen.rect(x0, yA, unit * 7, barH, "bold");
  for (let i = 1; i < 7; i++) pen.line(x0 + unit * i, yA, x0 + unit * i, yA + barH, "line");
  pen.dimension(x0, yA, right, yA, -190, "building software", 40);
  pen.hatch([[[x0, yA], [right, yA], [right, yA + barH], [x0, yA + barH]]], Math.PI / 4, 34);

  // three years leading the society
  const rightB = x0 + unit * 3;
  pen.rect(x0, yB, unit * 3, barH, "bold");
  for (let i = 1; i < 3; i++) pen.line(x0 + unit * i, yB, x0 + unit * i, yB + barH, "line");
  pen.dimension(x0, yB + barH, rightB, yB + barH, 120, "society president", 40);
  pen.hatch([[[x0, yB], [rightB, yB], [rightB, yB + barH], [x0, yB + barH]]], -Math.PI / 4, 34);

  // the present edge, and what sits on it
  pen.line(right, f.y + 210, right, axis + 40, "bold");
  pen.leader(right, yA + barH * 0.4, right - 470, yA + barH + 250, "HubX AI Lab, WaterLog", 40, "right");
  pen.leader(right, yB + barH * 0.5, right - 300, yB - 60, "B.Sc. 2026", 40, "right");
  return pen.finish();
}

// ------------------------------------------------------------- 2 research --
function layerStack(): Construction {
  const f = FOCUS[2];
  const pen = new Pen("research", f, 37);
  const cx = f.x + f.w / 2 - 40;
  const a = 430;
  const th = 46;
  const plates = 6;
  const gap = 205;
  const bottom = f.y + f.h - 330;

  pen.line(cx, bottom + 330, cx, f.y + 60, "dash");
  const corner = (k: number, x: number, y: number, z = 0) => iso(cx, bottom - k * gap, x, y, z);

  for (let k = 0; k < plates; k++) {
    const top: Point[] = [corner(k, -a, -a), corner(k, a, -a), corner(k, a, a), corner(k, -a, a)];
    // construction: the plate's diagonals
    pen.line(top[0][0], top[0][1], top[2][0], top[2][1], "guide");
    pen.line(top[1][0], top[1][1], top[3][0], top[3][1], "guide");
    pen.poly(top, "bold", true);
    // two visible edges of the thickness
    const drop = (p: Point): Point => [p[0], p[1] + th];
    pen.poly([top[3], drop(top[3]), drop(top[2]), drop(top[1]), top[1]], "line");
    pen.line(top[2][0], top[2][1], top[2][0], top[2][1] + th, "line");
    // the two kinds of block alternate, which is all "hybrid" claims here
    pen.hatch([top], k % 2 === 0 ? Math.atan2(0.5, 0.866) : -Math.atan2(0.5, 0.866), k % 2 === 0 ? 48 : 68);
  }

  // flow
  const tipY = f.y + 40;
  pen.poly(
    [
      [cx, tipY],
      [cx - 13, tipY + 40],
      [cx + 13, tipY + 40],
    ],
    "line",
    true,
  );
  pen.text(cx + 36, tipY + 34, "next token", 28, "left");
  pen.text(cx + 36, bottom + 320, "tokens in", 28, "left");

  const edgeX = cx + a * 1.732 * 0.5 + 250;
  pen.leader(corner(1, a, -a)[0], corner(1, a, -a)[1], edgeX, bottom - gap - 20, "block B", 28, "left");
  pen.leader(corner(2, a, -a)[0], corner(2, a, -a)[1], edgeX, bottom - gap * 2 - 20, "block A", 28, "left");
  return pen.finish();
}

// ----------------------------------------------------------------- 3 work --
function isoBlocks(): Construction {
  const f = FOCUS[3];
  const pen = new Pen("work", f, 53);
  const cx = f.x + 330;
  const cy = f.y + 640;

  // ground grid, in construction blue
  for (let i = -1; i <= 8; i++) {
    const p = iso(cx, cy, i * 200, -250, 0);
    const q = iso(cx, cy, i * 200, 600, 0);
    pen.line(p[0], p[1], q[0], q[1], "guide");
  }
  for (let j = -1; j <= 3; j++) {
    const p = iso(cx, cy, -250, j * 200, 0);
    const q = iso(cx, cy, 1640, j * 200, 0);
    pen.line(p[0], p[1], q[0], q[1], "guide");
  }

  // five disciplines, five built things. Heights are composition, not data, so none is labelled.
  const blocks: [number, number, number, number, number][] = [
    [0, 0, 250, 290, 330],
    [350, 60, 210, 210, 560],
    [660, 0, 280, 300, 230],
    [1030, 80, 190, 190, 470],
    [1310, 0, 250, 280, 300],
  ];
  for (const [x, y, w, d, h] of blocks) {
    const P = (px: number, py: number, pz: number) => iso(cx, cy, px, py, pz);
    const top: Point[] = [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)];
    const right: Point[] = [P(x + w, y, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x + w, y, 0)];
    const left: Point[] = [P(x, y + d, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x, y + d, 0)];
    // footprint first, the way it would be set out
    pen.poly([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)], "guide", true);
    pen.poly(top, "bold", true);
    pen.poly([left[3], left[2], right[2], right[3]], "bold");
    pen.line(left[0][0], left[0][1], left[3][0], left[3][1], "bold");
    pen.line(left[1][0], left[1][1], left[2][0], left[2][1], "bold");
    pen.line(right[0][0], right[0][1], right[3][0], right[3][1], "bold");
    pen.hatch([right], Math.PI / 2, 22);
  }

  const [bx, by, , bd, bh] = blocks[1];
  const foot = iso(cx, cy, bx, by + bd, 0);
  const head = iso(cx, cy, bx, by + bd, bh);
  pen.dimension(foot[0], foot[1], head[0], head[1], 90, "h");
  return pen.finish();
}

// -------------------------------------------------------------- 4 writing --
function notebook(): Construction {
  const f = FOCUS[4];
  const pen = new Pen("writing", f, 71);
  const front = rotatedRect(f.x + 1010, f.y + 800, 1020, 1340, 0.045);
  const back = rotatedRect(f.x + 800, f.y + 760, 1020, 1340, -0.085);

  // the sheet underneath only shows where the top sheet does not cover it
  for (let i = 0; i < 4; i++) {
    for (const [a, b] of outsideConvex(back[i], back[(i + 1) % 4], front)) pen.line(a[0], a[1], b[0], b[1], "line");
  }
  pen.poly(front, "bold", true);

  const along = (u: number, v: number): Point => {
    // u, v in 0..1 across the front sheet
    const top: Point = [front[0][0] + (front[1][0] - front[0][0]) * u, front[0][1] + (front[1][1] - front[0][1]) * u];
    const bottom: Point = [front[3][0] + (front[2][0] - front[3][0]) * u, front[3][1] + (front[2][1] - front[3][1]) * u];
    return [top[0] + (bottom[0] - top[0]) * v, top[1] + (bottom[1] - top[1]) * v];
  };

  // margin and rules
  const m0 = along(0.17, 0.03);
  const m1 = along(0.17, 0.97);
  pen.line(m0[0], m0[1], m1[0], m1[1], "guide");
  const rows = 17;
  for (let r = 0; r < rows; r++) {
    const v = 0.14 + (r / (rows - 1)) * 0.78;
    const p = along(0.04, v);
    const q = along(0.96, v);
    pen.line(p[0], p[1], q[0], q[1], "guide");
  }
  for (const v of [0.22, 0.5, 0.78]) {
    const c = along(0.075, v);
    pen.circle(c[0], c[1], 22, "line");
  }

  // handwriting: a line of text is a low wave with gaps for words
  const write = (row: number, from: number, to: number, kind: "line" | "bold") => {
    const v = 0.14 + (row / (rows - 1)) * 0.78 - 0.012;
    let u = from;
    while (u < to - 0.03) {
      const word = 0.035 + pen.random() * 0.09;
      const end = Math.min(to, u + word);
      const pts: Point[] = [];
      const steps = Math.max(4, Math.round((end - u) * 120));
      const amp = kind === "bold" ? 0.0075 : 0.0052;
      for (let i = 0; i <= steps; i++) {
        const uu = u + ((end - u) * i) / steps;
        pts.push(along(uu, v + Math.sin(i * 1.9 + row) * amp * (0.5 + pen.random())));
      }
      pen.poly(pts, kind);
      u = end + 0.018;
    }
  };
  write(0, 0.21, 0.62, "bold");
  const lengths = [0.93, 0.9, 0.94, 0.58, 0, 0.92, 0.95, 0.88, 0.91, 0.4, 0, 0.93, 0.9, 0.74];
  lengths.forEach((to, i) => {
    if (to > 0) write(i + 2, 0.21, to, "line");
  });

  // index tabs on the right edge
  const tabs = ["courses", "blog", "stories"];
  tabs.forEach((name, i) => {
    const v0 = 0.12 + i * 0.13;
    const a = along(1, v0);
    const b = along(1, v0 + 0.1);
    const out = 120;
    const dirX = (front[1][0] - front[0][0]) / 1020;
    const dirY = (front[1][1] - front[0][1]) / 1020;
    const a2: Point = [a[0] + dirX * out, a[1] + dirY * out];
    const b2: Point = [b[0] + dirX * out, b[1] + dirY * out];
    pen.poly([a, a2, b2, b], "line");
    pen.text(a2[0] + 30, (a2[1] + b2[1]) / 2 + 10, name, 28, "left");
  });
  return pen.finish();
}

// -------------------------------------------------------------- 5 gallery --
function studio(): Construction {
  const f = FOCUS[5];
  const pen = new Pen("gallery", f, 89);

  // lens, front elevation
  const lx = f.x + 440;
  const ly = f.y + 540;
  pen.line(lx - 520, ly, lx + 520, ly, "dash");
  pen.line(lx, ly - 520, lx, ly + 520, "dash");
  pen.circle(lx, ly, 440, "bold");
  pen.circle(lx, ly, 396, "line");
  pen.circle(lx, ly, 310, "line");
  pen.circle(lx, ly, 130, "guide");
  const blades = 7;
  const open = 130;
  for (let i = 0; i < blades; i++) {
    const a0 = (i / blades) * TAU - Math.PI / 2;
    const a1 = ((i + 1) / blades) * TAU - Math.PI / 2;
    const v0: Point = [lx + Math.cos(a0) * open, ly + Math.sin(a0) * open];
    const v1: Point = [lx + Math.cos(a1) * open, ly + Math.sin(a1) * open];
    const dx = v1[0] - v0[0];
    const dy = v1[1] - v0[1];
    const d = Math.hypot(dx, dy);
    // extend the opening's edge until it meets the barrel
    let t = 1;
    for (let step = 0; step < 400; step++) {
      const px = v0[0] + (dx / d) * t;
      const py = v0[1] + (dy / d) * t;
      if (Math.hypot(px - lx, py - ly) >= 310) break;
      t += 2;
    }
    pen.line(v0[0], v0[1], v0[0] + (dx / d) * t, v0[1] + (dy / d) * t, "line");
  }
  // knurled grip
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * TAU;
    pen.poly(
      [
        [lx + Math.cos(a) * 402, ly + Math.sin(a) * 402],
        [lx + Math.cos(a) * 434, ly + Math.sin(a) * 434],
      ],
      "hatch",
    );
  }
  pen.leader(lx + Math.cos(-0.7) * 440, ly + Math.sin(-0.7) * 440, lx + 470, ly - 470, "f/2.8", 28, "left");

  // a photograph, composed on thirds
  const px = f.x + 1000;
  const py = f.y + 210;
  const pw = 660;
  const ph = 440;
  for (const k of [1 / 3, 2 / 3]) {
    pen.line(px + pw * k, py, px + pw * k, py + ph, "guide");
    pen.line(px, py + ph * k, px + pw, py + ph * k, "guide");
  }
  pen.rect(px, py, pw, ph, "bold");
  pen.line(px, py + ph * (2 / 3), px + pw, py + ph * (2 / 3), "line");
  pen.poly(
    [
      [px + 40, py + ph * (2 / 3)],
      [px + 230, py + 150],
      [px + 330, py + 245],
      [px + 440, py + 120],
      [px + pw - 30, py + ph * (2 / 3)],
    ],
    "line",
  );
  pen.circle(px + pw * (2 / 3), py + ph / 3, 40, "line");
  pen.text(px, py + ph + 56, "rule of thirds", 28, "left");

  // a comics page
  const cxp = f.x + 1730;
  const cyp = f.y + 120;
  const cw = 480;
  const chh = 700;
  const g = 22;
  pen.rect(cxp, cyp, cw, chh, "bold");
  const rowH = (chh - g * 4) / 3;
  const r1 = cyp + g;
  const r2 = r1 + rowH + g;
  const r3 = r2 + rowH + g;
  const inner = cw - g * 2;
  pen.rect(cxp + g, r1, inner * 0.6 - g / 2, rowH, "line");
  pen.rect(cxp + g + inner * 0.6 + g / 2, r1, inner * 0.4 - g / 2, rowH, "line");
  pen.rect(cxp + g, r2, inner, rowH, "line");
  const third = (inner - g * 2) / 3;
  for (let i = 0; i < 3; i++) pen.rect(cxp + g + i * (third + g), r3, third, rowH, "line");
  // a speech balloon and some speed lines
  const bxc = cxp + g + inner * 0.32;
  const byc = r2 + rowH * 0.42;
  const balloon: Point[] = [];
  for (let k = 0; k < 44; k++) balloon.push([bxc + Math.cos((k / 44) * TAU) * 120, byc + Math.sin((k / 44) * TAU) * 58]);
  pen.poly(balloon, "line", true);
  pen.poly(
    [
      [bxc - 30, byc + 52],
      [bxc - 62, byc + 100],
      [bxc + 6, byc + 57],
    ],
    "line",
  );
  for (let i = 0; i < 7; i++) {
    const y = r2 + 26 + i * ((rowH - 52) / 6);
    pen.poly(
      [
        [cxp + g + inner * 0.62 + pen.random() * 40, y],
        [cxp + g + inner - 14, y],
      ],
      "hatch",
    );
  }
  pen.text(cxp, cyp + chh + 56, "six panels", 28, "left");
  return pen.finish();
}

// ------------------------------------------------------- sheet furniture --
function sheetFrame(): Construction {
  const pen = new Pen("sheet", { x: 0, y: 0, w: SHEET.w, h: SHEET.h }, 7);
  const o = 110;
  const i = 210;
  pen.rect(o, o, SHEET.w - o * 2, SHEET.h - o * 2, "line");
  pen.rect(i, i, SHEET.w - i * 2, SHEET.h - i * 2, "bold");

  // zones: numbers along the top and bottom, letters down the sides
  const cols = 8;
  const rows = 6;
  const cw = (SHEET.w - i * 2) / cols;
  const rh = (SHEET.h - i * 2) / rows;
  for (let c = 0; c <= cols; c++) {
    const x = i + c * cw;
    pen.line(x, o, x, i, "line");
    pen.line(x, SHEET.h - i, x, SHEET.h - o, "line");
    if (c < cols) {
      pen.text(x + cw / 2, o + 70, String(c + 1), 44, "center");
      pen.text(x + cw / 2, SHEET.h - o - 30, String(c + 1), 44, "center");
    }
  }
  for (let r = 0; r <= rows; r++) {
    const y = i + r * rh;
    pen.line(o, y, i, y, "line");
    pen.line(SHEET.w - i, y, SHEET.w - o, y, "line");
    if (r < rows) {
      pen.text((o + i) / 2, y + rh / 2 + 16, "ABCDEF"[r], 44, "center");
      pen.text(SHEET.w - (o + i) / 2, y + rh / 2 + 16, "ABCDEF"[r], 44, "center");
    }
  }
  // centring marks
  pen.line(SHEET.w / 2, o - 60, SHEET.w / 2, i + 60, "line");
  pen.line(SHEET.w / 2, SHEET.h - i - 60, SHEET.w / 2, SHEET.h - o + 60, "line");
  pen.line(o - 60, SHEET.h / 2, i + 60, SHEET.h / 2, "line");
  pen.line(SHEET.w - i - 60, SHEET.h / 2, SHEET.w - o + 60, SHEET.h / 2, "line");
  return pen.finish();
}

export interface RouteStop {
  x: number;
  y: number;
  /** share of the path length at which this stop sits */
  at: number;
  label: string;
}

export interface Route {
  path: Construction;
  stops: RouteStop[];
}

/** The path the camera flies, drawn on the sheet itself so the last view is a record of the visit. */
function route(constructions: Construction[]): Route {
  const pen = new Pen("route", { x: 0, y: 0, w: SHEET.w, h: SHEET.h }, 5);
  const centres: Point[] = constructions.map((c) => [c.focus.x + c.focus.w / 2, c.focus.y + c.focus.h * 0.5]);
  // pass beside each figure, not through it
  const offsets: Point[] = [
    [-160, 820],
    [60, 760],
    [-860, 120],
    [0, 860],
    [1080, 300],
    [-1380, 120],
  ];
  const PER = 40;
  const points: Point[] = centres.map(([x, y], k) => [x + offsets[k][0], y + offsets[k][1]]);
  pen.poly(spline(points, PER), "dash");
  const path = pen.finish();
  const stroke = path.strokes[0];
  const stops = points.map(([x, y], k) => ({
    x,
    y,
    at: stroke.total ? stroke.len[Math.min(k * PER, stroke.len.length - 1)] / stroke.total : 0,
    label: String(k + 1),
  }));
  return { path, stops };
}

/** Loose marks on a nearer sheet of vellum. They pass a little faster than the drawing. */
function vellum(): Construction {
  const pen = new Pen("vellum", { x: 0, y: 0, w: SHEET.w, h: SHEET.h }, 3);
  const marks: Point[] = [
    [2700, 380],
    [5050, 1500],
    [4900, 3300],
    [2500, 2050],
    [420, 2250],
    [2250, 4600],
    [5600, 3900],
  ];
  for (const [x, y] of marks) {
    pen.circle(x, y, 46, "guide");
    pen.line(x - 90, y, x + 90, y, "guide");
    pen.line(x, y - 90, x, y + 90, "guide");
  }
  // a scale bar and two long sweeps of the compass
  const sx = 3150;
  const sy = 2020;
  pen.line(sx, sy, sx + 900, sy, "guide");
  for (let k = 0; k <= 9; k++) pen.line(sx + k * 100, sy, sx + k * 100, sy - (k % 3 === 0 ? 40 : 22), "guide");
  pen.arc(1500, 1200, 1750, 0.12, 0.74, "guide");
  pen.arc(3700, 4300, 1500, -2.1, -1.25, "guide");
  return pen.finish();
}

export interface World {
  constructions: Construction[];
  frame: Construction;
  route: Route;
  vellum: Construction;
}

export function buildWorld(): World {
  const constructions = [monogram(), durations(), layerStack(), isoBlocks(), notebook(), studio()];
  return { constructions, frame: sheetFrame(), route: route(constructions), vellum: vellum() };
}
