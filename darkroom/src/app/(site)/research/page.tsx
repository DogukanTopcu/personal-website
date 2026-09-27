import type { Metadata } from "next";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { listPublications } from "@/lib/data/publications";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Research",
  description: "Academic publications, theses and talks.",
  alternates: { canonical: "/research" },
};

const KIND: Record<string, string> = {
  thesis: "Thesis",
  journal: "Journal article",
  conference: "Conference paper",
  preprint: "Preprint",
  report: "Report",
  talk: "Talk",
};

/**
 * A publication list is read the way a bibliography is: by year, with the
 * whole citation visible. A paper title is long, so it is set in the reading
 * face, not the gothic. Each entry opens to its abstract in place, and each
 * carries its slug as an anchor, which is what the sitemap links to.
 */
export default async function ResearchPage() {
  const publications = await listPublications();
  const years = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);

  return (
    <>
      <PageHead title="Research" lede="Publications, theses and talks. Small language models are the through line." />

      <div className="wrap section">
        {publications.length === 0 ? (
          <Empty title="Nothing published yet" body="Papers, theses and talks will be listed here." />
        ) : (
          <div className="bibliography">
            {years.map((year) => (
              <section key={year} className="research-year" aria-labelledby={`year-${year}`}>
                <h2 id={`year-${year}`} className="research-year__title nums">
                  {year}
                </h2>
                <ol className="research-list">
                  {publications
                    .filter((p) => p.year === year)
                    .map((pub) => (
                      <li key={pub.id} id={pub.slug} className="research-entry">
                        <p className="t-label research-entry__kind">{KIND[pub.kind] ?? pub.kind}</p>
                        <article className="research-entry__body">
                          <h3 className="research-entry__title">{pub.title}</h3>
                          <p className="research-entry__cite">
                            {pub.authors.length > 0 && <>{pub.authors.join(", ")}. </>}
                            {pub.venue && <cite>{pub.venue}</cite>}
                            {pub.published_on ? `, ${formatDate(pub.published_on)}` : pub.venue ? `, ${pub.year}` : pub.year}.
                          </p>

                          {pub.abstract && (
                            <details className="research-abstract">
                              <summary>Abstract</summary>
                              <p>{pub.abstract}</p>
                            </details>
                          )}

                          {(pub.pdf_url || pub.doi || pub.url || pub.bibtex) && (
                            <p className="research-entry__links">
                              {pub.pdf_url && (
                                <a className="link" href={pub.pdf_url} target="_blank" rel="noopener noreferrer">
                                  PDF
                                </a>
                              )}
                              {pub.doi && (
                                <a className="link" href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">
                                  DOI
                                </a>
                              )}
                              {pub.url && (
                                <a className="link" href={pub.url} target="_blank" rel="noopener noreferrer">
                                  Publisher
                                </a>
                              )}
                              {pub.bibtex && (
                                <a className="link" href={`/research/${pub.slug}/citation.bib`} download>
                                  BibTeX
                                </a>
                              )}
                            </p>
                          )}

                          {pub.keywords.length > 0 && (
                            <ul className="tags research-entry__keywords" aria-label="Keywords">
                              {pub.keywords.map((k) => (
                                <li key={k}>{k}</li>
                              ))}
                            </ul>
                          )}
                        </article>
                      </li>
                    ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
