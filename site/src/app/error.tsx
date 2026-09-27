"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="wrap status-page">
      <p className="t-label">Something broke</p>
      <h1 className="t-h1">This page did not come out right</h1>
      <p className="t-lede">
        An error stopped the page from rendering. Trying again often works. If it does not, the content behind it may be
        temporarily unreachable.
      </p>
      <div className="status-page__actions">
        <button className="btn btn--primary" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="btn" href="/">
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="t-caption status-page__digest">
          Reference <span className="nums">{error.digest}</span>
        </p>
      )}
    </main>
  );
}
