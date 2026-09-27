/** Small, seedable: the mark must look the same on every visit. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A grease pencil loop around a frame, in a 100 by 100 box: one quick stroke
 * that comes round a little past where it started and tightens slightly as it
 * goes, the way a hand circles a pick on a contact sheet.
 */
export function greaseLoop(seed = 7): string {
  const rand = mulberry32(seed);
  const steps = 72;
  const start = -2.35;
  const sweep = Math.PI * 2 * 1.13;
  let wobble = 0;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + sweep * t;
    wobble = wobble * 0.8 + (rand() - 0.5) * 0.035;
    const tighten = 1 - 0.07 * t;
    const rx = 48 * (1 + wobble) * tighten;
    const ry = 45 * (1 + wobble) * tighten;
    points.push(`${(50 + Math.cos(angle) * rx).toFixed(2)} ${(50 + Math.sin(angle) * ry).toFixed(2)}`);
  }
  return `M${points.join(" L")}`;
}
