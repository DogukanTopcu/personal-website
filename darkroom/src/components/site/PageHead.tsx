import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { href?: string; label: string };

export function PageHead({
  crumbs,
  title,
  lede,
  meta,
  align = "start",
  children,
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  lede?: ReactNode;
  meta?: ReactNode;
  /** "center" sets the head like an intertitle, for pages read start to finish */
  align?: "start" | "center";
  children?: ReactNode;
}) {
  return (
    <header className={clsx("page-head", align === "center" && "page-head--center")}>
      <div className="wrap">
        {crumbs && crumbs.length > 0 && (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <span className="crumbs__sep" aria-hidden="true">
                    /{" "}
                  </span>
                )}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="t-h1 page-head__title">{title}</h1>
        {lede && <p className="t-lede page-head__lede">{lede}</p>}
        {meta && <div className="page-head__meta">{meta}</div>}
        {children}
      </div>
    </header>
  );
}
