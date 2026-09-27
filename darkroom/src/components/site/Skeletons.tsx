import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

/*
 * Loading states: the outline of the page that is coming. Text is a faint
 * rule that breathes (`.skeleton`); pictures are unexposed frames that breathe
 * with it. No spinner, no grey photograph.
 */

const line = (width: string, height = "0.9rem", style?: CSSProperties) => (
  <div className="skeleton" style={{ height, maxWidth: width, ...style }} />
);

export function Loading({ children }: { children: ReactNode }) {
  return (
    <div className="skel" aria-busy="true" aria-live="polite">
      {children}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function HeadSkeleton({ crumbs = false, meta = false, center = false }: { crumbs?: boolean; meta?: boolean; center?: boolean }) {
  return (
    <div className={clsx("page-head", center && "page-head--center")}>
      <div className="wrap skel__head">
        {crumbs && line("14rem", "0.7rem", { marginBottom: "1.4rem" })}
        {line("26rem", "clamp(2.6rem, 1.5rem + 4vw, 5.2rem)")}
        {line("38rem", "1.1rem", { marginTop: "1.5rem" })}
        {line("30rem", "1.1rem", { marginTop: "0.7rem" })}
        {meta && line("12rem", "0.7rem", { marginTop: "1.6rem" })}
      </div>
    </div>
  );
}

/** An unexposed frame, breathing. */
export function FrameSkeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={clsx("frame frame--unexposed skel__frame", className)} style={style} />;
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="index">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <div className="entry">
            {line("6rem", "0.75rem")}
            <div>
              {line(i % 2 ? "22rem" : "30rem", "1.9rem")}
              {line("40rem", "0.9rem", { marginTop: "1rem" })}
              {line("34rem", "0.9rem", { marginTop: "0.6rem" })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProseSkeleton({ paragraphs = 3 }: { paragraphs?: number }) {
  return (
    <div className="skel__prose">
      {Array.from({ length: paragraphs }, (_, p) => (
        <div key={p} className="skel__para">
          {["100%", "96%", "99%", "62%"].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: "0.95rem", width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}
