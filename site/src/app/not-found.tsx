import Link from "next/link";
import { SECTIONS } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="wrap status-page">
      <p className="t-label">Error 404</p>
      <h1 className="t-h1">Page not found</h1>
      <p className="t-lede">
        The page you asked for does not exist, or it has not been published yet. Everything that has been published is
        below.
      </p>
      <ul className="filters status-page__links">
        <li>
          <Link href="/">Home</Link>
        </li>
        {SECTIONS.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
        <li>
          <Link href="/search">Search</Link>
        </li>
      </ul>
    </main>
  );
}
