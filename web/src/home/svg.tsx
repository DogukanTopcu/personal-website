import type { Construction, Stroke } from "./world/geometry";

/**
 * The same constructions, rendered as inline SVG for the static page: no
 * JavaScript, reduced motion, or a browser without a 2D canvas. Fully inked,
 * with the pencil pass still faintly under it, because that is what a finished
 * sheet looks like.
 */

const round = (n: number) => Math.round(n * 10) / 10;

function toPath(pts: Float32Array): string {
  let d = `M${round(pts[0])} ${round(pts[1])}`;
  for (let i = 1; i < pts.length / 2; i++) d += `L${round(pts[i * 2])} ${round(pts[i * 2 + 1])}`;
  return d;
}

function group(strokes: Stroke[], pass: "pencil" | "ink") {
  const byKind = new Map<string, string[]>();
  for (const s of strokes) {
    if (pass === "pencil" && s.kind === "hatch") continue;
    if (pass === "ink" && (s.kind === "guide" || s.kind === "dash")) continue;
    const list = byKind.get(s.kind) ?? [];
    list.push(toPath(pass === "pencil" ? s.jit : s.pts));
    byKind.set(s.kind, list);
  }
  return byKind;
}

const INK_WIDTH: Record<string, number> = { line: 1.5, bold: 2.5, hatch: 0.9 };
const PENCIL_WIDTH: Record<string, number> = { guide: 0.95, dash: 0.95, line: 1.15, bold: 1.3 };
const PENCIL_ALPHA: Record<string, number> = { guide: 0.5, dash: 0.5, line: 0.34, bold: 0.34 };

export function ConstructionSvg({ construction, title }: { construction: Construction; title: string }) {
  const { bounds } = construction;
  const pencil = group(construction.strokes, "pencil");
  const ink = group(construction.strokes, "ink");
  // Stroke widths are in sheet units here, so they scale with the drawing.
  const unit = Math.max(bounds.w, bounds.h) / 900;

  return (
    <svg
      className="construction"
      viewBox={`${round(bounds.x)} ${round(bounds.y)} ${round(bounds.w)} ${round(bounds.h)}`}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="var(--pencil)">
        {[...pencil].map(([kind, paths]) => (
          <path
            key={`p-${kind}`}
            d={paths.join(" ")}
            strokeWidth={PENCIL_WIDTH[kind] * unit}
            opacity={PENCIL_ALPHA[kind]}
            strokeDasharray={kind === "dash" ? `${30 * unit} ${12 * unit} ${5 * unit} ${12 * unit}` : undefined}
          />
        ))}
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="var(--ink)">
        {[...ink].map(([kind, paths]) => (
          <path key={`i-${kind}`} d={paths.join(" ")} strokeWidth={INK_WIDTH[kind] * unit} opacity={kind === "hatch" ? 0.78 : 1} />
        ))}
      </g>
      <g fill="var(--ink)" fontFamily="var(--font-mono)" fontWeight={500}>
        {construction.labels.map((label, i) => (
          <text
            key={i}
            x={round(label.x)}
            y={round(label.y)}
            fontSize={label.size}
            textAnchor={label.align === "center" ? "middle" : label.align === "right" ? "end" : "start"}
            transform={label.rotate ? `rotate(${round((label.rotate * 180) / Math.PI)} ${round(label.x)} ${round(label.y)})` : undefined}
          >
            {label.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
