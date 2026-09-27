#!/usr/bin/env node
/**
 * Walks the home page's scroll track and writes a contact sheet.
 *
 *   node scripts/shoot-home.mjs [--url http://localhost:3100] [--out lab/desktop]
 *                               [--width 1440] [--height 900] [--reduced] [--no-js]
 *
 * Reports, per sample: the camera, how far each construction is drawn, which
 * copy blocks are visible, and the contrast of every visible line of copy
 * measured on the composited page. Then it flags dead scroll: two adjacent
 * samples where nothing moved and nothing faded.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const url = flag("url", "http://localhost:3100");
const outDir = path.resolve(flag("out", "lab/desktop"));
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const perLeg = Number(flag("per-leg", 5));
const reduced = has("reduced");
const noJs = has("no-js");

const LEGS = [1.0, 1.3, 1.1, 1.3, 1.2, 1.3, 1.9];
const WAYPOINTS = ["Title", "Profile", "Research", "Work", "Writing", "Gallery", "Sheet"];
const TRACK = LEGS.reduce((a, b) => a + b, 0);

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: reduced ? "reduce" : "no-preference",
  colorScheme: flag("scheme", "light"),
  javaScriptEnabled: !noJs,
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") consoleErrors.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
const failedRequests = [];
page.on("requestfailed", (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText ?? ""}`));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2600); // the intro draft runs on a clock

const samples = [];
let shot = 0;

// Build the sample list: evenly through each leg, plus every waypoint's rest point.
const positions = [];
let start = 0;
for (let leg = 0; leg < LEGS.length; leg++) {
  for (let i = 0; i < perLeg; i++) positions.push({ t: start + (LEGS[leg] * i) / perLeg, leg });
  start += LEGS[leg];
}
positions.push({ t: TRACK, leg: LEGS.length - 1 });

for (const { t, leg } of positions) {
  await page.evaluate((y) => window.scrollTo(0, y), t * height);
  // Wait for the camera lerp to settle so the frame is one the page actually holds.
  await page.waitForFunction(
    (target) => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sheet-t"));
      return Number.isNaN(v) || Math.abs(v - target) < 0.004;
    },
    t,
    { timeout: 4000 },
  ).catch(() => {});
  await page.waitForTimeout(120);

  const state = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const copies = [...document.querySelectorAll("[data-sc-copy]")].map((el) => {
      const op = parseFloat(getComputedStyle(el).opacity) || 0;
      const box = el.getBoundingClientRect();
      const heading = el.querySelector("h1, h2");
      return {
        label: heading?.textContent?.slice(0, 34) ?? el.className,
        opacity: Number(op.toFixed(3)),
        box: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) },
      };
    });
    return {
      t: parseFloat(s.getPropertyValue("--sheet-t")) || 0,
      seg: s.getPropertyValue("--sc-seg").trim(),
      copies,
      scrollY: window.scrollY,
    };
  });

  const file = path.join(outDir, `${String(shot).padStart(2, "0")}-leg${leg}-t${t.toFixed(2)}.png`);
  await page.screenshot({ path: file });
  samples.push({ ...state, t, leg, file });
  shot++;
}

// --------------------------------------------------------------- contrast --
// Measured on the composited page: hide the copy block, photograph what is
// behind it, and grade each line against the worst pixel under it.
const relLum = (r, g, b) => {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const contrastFindings = [];
if (!noJs) {
  const restPoints = WAYPOINTS.map((_, i) => {
    if (i === 0) return 0.25;
    const legStart = LEGS.slice(0, i).reduce((a, b) => a + b, 0);
    return legStart + LEGS[i] * 0.55;
  });

  for (const [i, t] of restPoints.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), t * height);
    await page.waitForTimeout(700);

    const lines = await page.evaluate(() => {
      // getComputedStyle returns color-mix() as color(srgb ...) in Chrome, and
      // an rgba regex silently misses it, which reads as a contrast failure on
      // text that actually sits on a solid plate. Paint it instead.
      const probe = document.createElement("canvas");
      probe.width = probe.height = 1;
      const probeCtx = probe.getContext("2d", { willReadFrequently: true });
      const toRgba = (css) => {
        probeCtx.clearRect(0, 0, 1, 1);
        probeCtx.fillStyle = "#000";
        probeCtx.fillStyle = css;
        probeCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
        return { rgb: [r, g, b], alpha: a / 255 };
      };

      const out = [];
      for (const block of document.querySelectorAll("[data-sc-copy], .map-rail")) {
        if ((parseFloat(getComputedStyle(block).opacity) || 0) < 0.5) continue;
        for (const el of block.querySelectorAll("h1, h2, p, a, span, div, strong")) {
          if (!el.textContent?.trim() || el.children.length > 0) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 4 || box.height < 4) continue;
          const cs = getComputedStyle(el);
          // Walk up for backgrounds the element sits on. A button fill or the
          // title block's own plate is what the reader sees the text against,
          // and hiding the copy would photograph the frame instead of it.
          // A fill painted on ::before counts, but only when it actually
          // covers: the button's hover wipe sits at scaleX(0) at rest and
          // still reports its colour, which would grade ink against ink.
          const covering = (node) => {
            const ps = getComputedStyle(node, "::before");
            if (ps.content === "none" || ps.display === "none") return null;
            if ((parseFloat(ps.opacity) || 0) < 0.99) return null;
            const m = ps.transform.match(/matrix\(([^)]+)\)/);
            if (m && Math.abs(parseFloat(m[1].split(",")[0])) < 0.99) return null;
            return ps.backgroundColor;
          };
          const plates = [];
          for (let node = el; node && node !== document.body; node = node.parentElement) {
            for (const layer of [getComputedStyle(node).backgroundColor, covering(node)]) {
              if (!layer) continue;
              const plate = toRgba(layer);
              if (plate.alpha > 0.01) plates.push(plate);
            }
            if (plates.length && plates[plates.length - 1].alpha > 0.995) break;
          }
          out.push({
            text: el.textContent.trim().slice(0, 40),
            color: cs.color,
            textRgba: toRgba(cs.color),
            size: parseFloat(cs.fontSize),
            weight: cs.fontWeight,
            plates,
            box: { x: box.x, y: box.y, w: box.width, h: box.height },
          });
        }
      }
      return out;
    });

    // Photograph what is behind the copy. Only the copy blocks are hidden:
    // scrims are siblings and are part of what the reader actually sees.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("[data-sc-copy], .map-rail")) el.style.visibility = "hidden";
    });
    await page.waitForTimeout(140);
    const behind = await page.screenshot({ path: path.join(outDir, `behind-${i}.png`) });
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("[data-sc-copy], .map-rail")) el.style.visibility = "";
    });

    for (const line of lines) {
      const [r, g, b] = line.textRgba.rgb;
      const textLum = relLum(r, g, b);
      const worst = await page.evaluate(
        async ({ box, src }) => {
          const img = new Image();
          img.src = src;
          await img.decode();
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(box.w));
          c.height = Math.max(1, Math.round(box.h));
          const ctx = c.getContext("2d");
          ctx.drawImage(img, Math.round(box.x), Math.round(box.y), c.width, c.height, 0, 0, c.width, c.height);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          let min = 2;
          let max = -1;
          let darkest = [0, 0, 0];
          let brightest = [255, 255, 255];
          for (let p = 0; p < data.length; p += 4) {
            const f = (v) => {
              const n = v / 255;
              return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
            };
            const l = 0.2126 * f(data[p]) + 0.7152 * f(data[p + 1]) + 0.0722 * f(data[p + 2]);
            if (l < min) { min = l; darkest = [data[p], data[p + 1], data[p + 2]]; }
            if (l > max) { max = l; brightest = [data[p], data[p + 1], data[p + 2]]; }
          }
          return { darkest, brightest };
        },
        { box: line.box, src: `data:image/png;base64,${behind.toString("base64")}` },
      );

      // Light text fails on the brightest pixel under it, dark text on the
      // darkest. Any plate the text sits on is composited over that pixel
      // first, innermost last, which is the order the reader sees.
      const sample = (channelPick) => {
        let c = channelPick;
        for (const plate of [...line.plates].reverse()) {
          c = c.map((v, k) => plate.rgb[k] * plate.alpha + v * (1 - plate.alpha));
        }
        return relLum(c[0], c[1], c[2]);
      };
      const against = textLum > 0.5 ? sample(worst.brightest) : sample(worst.darkest);
      const value = ratio(textLum, against);
      const large = line.size >= 24 || (line.size >= 18.66 && Number(line.weight) >= 700);
      const need = large ? 3 : 4.5;
      if (value < need) {
        contrastFindings.push(`${WAYPOINTS[i]}: "${line.text}" ${value.toFixed(2)}:1 (needs ${need}:1, ${Math.round(line.size)}px)`);
      }
    }
  }
}

// ------------------------------------------------------------ dead scroll --
const dead = [];
for (let i = 1; i < samples.length; i++) {
  const a = samples[i - 1];
  const b = samples[i];
  if (b.t - a.t < 0.05) continue;
  const cameraMoved = Math.abs(b.t - a.t) > 0.001;
  const copyChanged = b.copies.some((c, k) => Math.abs(c.opacity - (a.copies[k]?.opacity ?? 0)) > 0.01);
  if (!cameraMoved && !copyChanged) dead.push(`${a.t.toFixed(2)} to ${b.t.toFixed(2)}`);
}

await context.close();
await browser.close();

// -------------------------------------------------------------- the sheet --
const files = (await readdir(outDir)).filter((f) => /^\d\d-/.test(f)).sort();
const cols = 5;
try {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-pattern_type", "glob",
      "-i", path.join(outDir, "[0-9][0-9]-*.png"),
      "-filter_complex", `scale=420:-1,tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=0x8b949e`,
      "-frames:v", "1",
      path.join(outDir, "sheet.png"),
    ],
    { stdio: "pipe" },
  );
} catch (e) {
  console.warn("contact sheet failed:", String(e.message).split("\n").slice(-3).join(" "));
}

console.log(`\n${reduced ? "REDUCED MOTION " : ""}${noJs ? "NO JS " : ""}${width}x${height}`);
console.log(`${samples.length} samples -> ${outDir}`);
console.log("\n t      leg  seg  visible copy");
for (const s of samples) {
  const visible = s.copies.filter((c) => c.opacity > 0.08).map((c) => `${c.label} ${c.opacity}`);
  console.log(` ${s.t.toFixed(2).padStart(5)}  ${s.leg}    ${s.seg.padStart(2)}   ${visible.join(" | ") || "(silence)"}`);
}

console.log(`\ndead scroll: ${dead.length ? dead.join(", ") : "none"}`);
console.log(`contrast failures: ${contrastFindings.length || "none"}`);
for (const f of contrastFindings) console.log(`  ${f}`);
console.log(`console errors: ${consoleErrors.length || "none"}`);
for (const e of consoleErrors.slice(0, 12)) console.log(`  ${e}`);
console.log(`failed requests: ${failedRequests.length || "none"}`);
for (const r of failedRequests.slice(0, 8)) console.log(`  ${r}`);

process.exitCode = contrastFindings.length || dead.length || consoleErrors.length ? 1 : 0;
