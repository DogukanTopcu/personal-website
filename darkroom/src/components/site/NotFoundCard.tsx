import Link from "next/link";
import { NAV } from "@/lib/site";

/**
 * One intertitle saying the page is not there, and every way on below it.
 * Home is a plain link, not a client-side one: the home page's scroll engine
 * needs a document of its own.
 */
export function NotFoundCard() {
  return (
    <>
      <div className="status-page__card">
        <p className="t-label">Error 404</p>
        <h1 className="status-page__title">Nothing is showing here</h1>
        <p className="status-page__body">
          The page you asked for does not exist, or it has not been published yet. Here is everything that has.
        </p>
      </div>
      <nav aria-label="Everything on this site">
        <ul className="status-page__links">
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">Home</a>
          </li>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/search">Search</Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
