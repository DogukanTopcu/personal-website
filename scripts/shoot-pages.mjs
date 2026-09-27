#!/usr/bin/env node
/**
 * Screenshots every public page at desktop and phone, in both themes, and
 * reports console errors, failed requests, horizontal overflow, contrast
 * failures on real copy, and any em dash that reached the page.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const base = flag("url", "http://localhost:3103");
const outDir = path.resolve(flag("out", "lab/pages"));
const scheme = flag("scheme", "light");
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const fullPage = args.includes("--full");

const PAGES = [
  ["home", "/"],
  ["about", "/about"],
  ["projects", "/projects"],
  ["project", "/projects/marketingx"],
  ["blog", "/blog"],
  ["post-review", "/blog/12-angry-men-sidney-lumet"],
  ["post-essay", "/blog/a-short-history-of-the-blueprint"],
  ["courses", "/courses"],
  ["course", "/courses/algorithm-analysis"],
  ["lesson", "/courses/algorithm-analysis/growth-and-big-o"],
  ["stories", "/stories"],
  ["story", "/stories/the-lighthouse-ledger"],
  ["chapter", "/stories/the-lighthouse-ledger/the-station"],
  ["research", "/research"],
  ["gallery", "/gallery"],
  ["gallery-room", "/gallery/drawings"],
  ["search", "/search?q=algorithm"],
  ["notfound", "/does-not-exist"],
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
// Below 700px this emulates an actual touch device, not just a narrow
// window: `pointer: coarse` is what the CSS keys its tap targets off.
const touch = width < 700;
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: scheme,
  hasTouch: touch,
  isMobile: touch,
});
const page = await context.newPage();

const problems = [];
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => { const t = r.failure()?.errorText ?? ""; if (!t.includes("aborted")) problems.push(`request: ${r.url()} ${t}`); });

for (const [name, url] of PAGES) {
  const before = problems.length;
  const response = await page.goto(base + url, { waitUntil: "networkidle" });
  const status = response?.status() ?? 0;
  if (status >= 500 || (status >= 400 && name !== "notfound")) problems.push(`${name}: HTTP ${status}`);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const audit = await page.evaluate(() => {
    const out = { overflow: 0, dashes: [], lowContrast: [], tinyTargets: [], wrappedCta: [] };
    out.overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent ?? "";
      if (t.includes("—") || t.includes("–")) out.dashes.push(t.trim().slice(0, 60));
    }

    const relLum = (r, g, b) => { const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const probe = document.createElement("canvas"); probe.width = probe.height = 1;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    const rgba = (css) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2],d[3]/255]; };
    const over = (fg, bg) => fg.slice(0,3).map((v,i) => v*fg[3] + bg[i]*(1-fg[3]));

    for (const el of document.querySelectorAll("p, h1, h2, h3, h4, a, li, span, button, dt, dd, summary, figcaption, time, strong, em, label, input")) {
      if (el.children.length > 0 && el.tagName !== "BUTTON" && el.tagName !== "A") continue;
      const text = el.tagName === "INPUT" ? (el.placeholder ?? "") : (el.textContent ?? "").trim();
      if (!text) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.opacity === "0") continue;
      // Content hidden from assistive tech is decoration: the meaning is
      // carried by a visually hidden label beside it.
      if (el.closest('[aria-hidden="true"]')) continue;

      const fg = el.tagName === "INPUT" ? rgba(cs.getPropertyValue("--placeholder") || cs.color) : rgba(cs.color);
      let bg = [255,255,255];
      for (let node = el; node; node = node.parentElement) {
        const c = rgba(getComputedStyle(node).backgroundColor);
        if (c[3] > 0.99) { bg = c.slice(0,3); break; }
        if (c[3] > 0) bg = over(c, bg);
      }
      const L1 = relLum(...over(fg, bg));
      const L2 = relLum(...bg);
      const ratio = (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05);
      const size = parseFloat(cs.fontSize);
      const need = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio < need) out.lowContrast.push(`"${text.slice(0,34)}" ${ratio.toFixed(2)}:1 (needs ${need})`);
    }

    // A wrapped CTA is one whose label really paints on more than one line.
    // Measuring the box against line-height guesses wrong on padded buttons.
    for (const el of document.querySelectorAll(".btn, button[type=submit]")) {
      const text = [...el.childNodes].find((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
      if (!text) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      if (range.getClientRects().length > 1) out.wrappedCta.push((el.textContent ?? "").trim().slice(0, 30));
    }

    if (innerWidth < 700) {
      for (const el of document.querySelectorAll("a, button, input, [role=button]")) {
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        // A link whose ::after is stretched over its container has the whole
        // row as its target, not the few pixels the text occupies.
        const after = getComputedStyle(el, "::after");
        let height = b.height;
        if (after.position === "absolute" && ["0px", "auto"].includes(after.top) && after.content !== "none") {
          const host = el.offsetParent ?? el.parentElement;
          if (host) height = Math.max(height, host.getBoundingClientRect().height);
        }
        // WCAG 2.5.8 (AA) asks for 24x24 and exempts a link inside a
        // sentence. Anything standalone and small is held to 40.
        const parentText = (el.parentElement?.textContent ?? "").trim();
        const inSentence = parentText.length > (el.textContent ?? "").trim().length + 8;
        const big = height >= 24 && b.width >= 120;
        const fails = height < 24 || (!big && height < 40);
        if (fails && !inSentence && !el.closest(".prose, .toc, .map-rail")) {
          out.tinyTargets.push((el.textContent ?? "").trim().slice(0, 26) || el.tagName);
        }
      }
    }
    return out;
  });

  if (audit.overflow > 1) problems.push(`${name}: horizontal overflow ${audit.overflow}px`);
  for (const d of audit.dashes) problems.push(`${name}: dash character in "${d}"`);
  for (const c of [...new Set(audit.lowContrast)]) problems.push(`${name}: contrast ${c}`);
  for (const c of [...new Set(audit.wrappedCta)]) problems.push(`${name}: CTA wraps "${c}"`);
  for (const t of [...new Set(audit.tinyTargets)].slice(0, 5)) problems.push(`${name}: tap target under 40px "${t}"`);

  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
  const found = problems.length - before;
  console.log(`${found ? "x" : " "} ${name.padEnd(14)} ${url}${found ? `  (${found})` : ""}`);
}

await context.close();
await browser.close();

try {
  execFileSync("ffmpeg", ["-y","-pattern_type","glob","-i",path.join(outDir,"*.png"),"-filter_complex",`scale=460:-1,tile=4x${Math.ceil(PAGES.length/4)}:padding=6:color=0x8b949e`,"-frames:v","1",path.join(outDir,"sheet.png")], { stdio: "pipe" });
} catch { /* contact sheet is a convenience */ }

console.log(`\n${scheme} ${width}x${height}: ${problems.length || "no"} problem(s)`);
for (const p of problems) console.log(`  ${p}`);
process.exitCode = problems.length ? 1 : 0;
