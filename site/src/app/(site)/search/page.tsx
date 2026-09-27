import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { searchSite } from "@/lib/data/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search everything on the site.",
  alternates: { canonical: "/search" },
  robots: { index: false },
};

const KIND: Record<string, string> = {
  post: "Writing",
  project: "Project",
  course: "Course",
  lesson: "Lesson",
  story: "Story",
  publication: "Research",
};

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const term = typeof q === "string" ? q : "";
  const results = term.trim().length >= 2 ? await searchSite(term) : [];

  return (
    <>
      <PageHead title="Search" lede="Everything published on the site: writing, work, courses, lessons, stories and research.">
        {/* A plain GET form, so it works with JavaScript switched off. */}
        <form className="search-form" action="/search" method="get" role="search">
          <label className="facts__key" htmlFor="q">
            What are you looking for
          </label>
          <div className="search-form__row">
            <input id="q" name="q" type="search" defaultValue={term} placeholder="Algorithms, Dune, robotics" autoComplete="off" />
            <button className="btn btn--primary" type="submit">
              Search
            </button>
          </div>
        </form>
      </PageHead>

      <div className="wrap section">
        {term.trim().length < 2 ? (
          <p className="t-lede">Type at least two characters.</p>
        ) : results.length === 0 ? (
          <Empty title={`Nothing found for "${term}"`} body="Try a single word, or a different one. Search looks at titles, summaries and the body of everything published." />
        ) : (
          <>
            <p className="t-data search-count">
              <span className="nums">{results.length}</span> {results.length === 1 ? "result" : "results"} for &ldquo;{term}&rdquo;
            </p>
            <ul className="index">
              {results.map((hit) => (
                <li key={hit.url}>
                  <article className="entry">
                    <p className="entry__aside">{KIND[hit.kind] ?? hit.kind}</p>
                    <div>
                      <h2 className="entry__title">
                        <Link href={hit.url}>{hit.title}</Link>
                      </h2>
                      {hit.summary && <p className="entry__body">{hit.summary}</p>}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
