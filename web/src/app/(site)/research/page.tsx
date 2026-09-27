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
 * whole citation visible. Each entry expands to its abstract in place, so
 * nothing needs a page of its own unless there is a full text to host.
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
          years.map((year) => (
            <section key={year} className="research-year">
              <h2 className="facts__key research-year__title nums">{year}</h2>
              <ul className="index">
                {publications
                  .filter((p) => p.year === year)
                  .map((pub) => (
                    <li key={pub.id}>
                      <article className="entry research-entry">
                        <p className="entry__aside">{KIND[pub.kind] ?? pub.kind}</p>
                        <div>
                          <h3 className="entry__title research-entry__title">{pub.title}</h3>
                          <p className="entry__body research-entry__cite">
                            {pub.authors.length > 0 && <>{pub.authors.join(", ")}. </>}
                            {pub.venue && <em>{pub.venue}</em>}
                            {pub.published_on ? `, ${formatDate(pub.published_on)}` : pub.venue ? `, ${pub.year}` : pub.year}.
                          </p>

                          {pub.abstract && (
                            <details className="research-abstract">
                              <summary>Abstract</summary>
                              <p>{pub.abstract}</p>
                            </details>
                          )}

                          <p className="title-block__links research-entry__links">
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

                          {pub.keywords.length > 0 && (
                            <ul className="tags entry__foot">
                              {pub.keywords.map((k) => (
                                <li key={k}>{k}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </article>
                    </li>
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
