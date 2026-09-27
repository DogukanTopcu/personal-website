import Link from "next/link";
import { NAV } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="wrap section status-page">
      <p className="facts__key">Error 404</p>
      <h1 className="t-h1">This sheet is not in the set</h1>
      <p className="t-lede">
        The page you asked for does not exist, or it has not been published yet. Here is everything that has.
      </p>
      <ul className="filters status-page__links">
        <li>
          <Link href="/">Home</Link>
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
    </main>
  );
}
