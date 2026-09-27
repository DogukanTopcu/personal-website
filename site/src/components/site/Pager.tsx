import Link from "next/link";

type Side = { href: string; title: string } | null;

export function Pager({ previous, next, previousLabel = "Previous", nextLabel = "Next" }: { previous: Side; next: Side; previousLabel?: string; nextLabel?: string }) {
  if (!previous && !next) return null;
  return (
    <nav className="pager" aria-label="More in this series">
      {previous ? (
        <Link className="pager__link" data-dir="previous" href={previous.href}>
          <span className="pager__key">{previousLabel}</span>
          <span className="pager__title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="pager__link" data-dir="next" href={next.href}>
          <span className="pager__key">{nextLabel}</span>
          <span className="pager__title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
