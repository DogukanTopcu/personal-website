import "katex/dist/katex.min.css";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Prose({ children, fiction = false, className }: { children: ReactNode; fiction?: boolean; className?: string }) {
  return <div className={clsx("prose", fiction && "prose--fiction", className)}>{children}</div>;
}
