"use client";

import { useEffect } from "react";
import "./(site)/sections.css";

/**
 * A black screen and one intertitle, with the two things worth doing next:
 * try again, or go home (a plain link: the home page lives in a document of
 * its own).
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="status-page">
      <div className="status-page__card">
        <p className="t-label">Something broke</p>
        <h1 className="status-page__title">This page did not come out right</h1>
        <p className="status-page__body">
          An error stopped the page from rendering. Trying again often works. If it does not, the content behind it may be
          temporarily unreachable.
        </p>
        {error.digest && (
          <p className="t-data status-page__digest">
            Reference <span className="nums">{error.digest}</span>
          </p>
        )}
      </div>
      <div className="status-page__actions">
        <button className="btn btn--primary" type="button" onClick={() => retry()}>
          Try again
        </button>
        {/* A full page load on purpose: the home page's scroll engine needs a document of its own. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="btn" href="/">
          Go home
        </a>
      </div>
    </main>
  );
}
