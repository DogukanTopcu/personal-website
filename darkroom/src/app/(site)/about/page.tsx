import type { Metadata } from "next";
import { Prose } from "@/components/content/Markdown";
import { Empty } from "@/components/site/Empty";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import { PageHead } from "@/components/site/PageHead";
import { listExperiences } from "@/lib/data/experiences";
import { contactHref, getSettings } from "@/lib/data/settings";
import { yearRange } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown/render";
import { CONTACT_LABEL } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description: "Who I am, what I have worked on, and what I am learning.",
  alternates: { canonical: "/about" },
};

const KIND_ORDER = ["work", "venture", "leadership", "education", "award"] as const;
const KIND_TITLE: Record<string, string> = {
  work: "Work",
  venture: "Ventures",
  leadership: "Leadership",
  education: "Education",
  award: "Awards",
};

/**
 * The portrait and the long version first. After that every part of the page
 * keeps its title in the left column and its content on the right, so the
 * page reads down one line: the years sit in their own mono column, the way
 * a career is listed at the back of a programme.
 */
export default async function AboutPage() {
  const [settings, experiences] = await Promise.all([getSettings(), listExperiences()]);
  const bio = await renderMarkdown(settings.bio_md);
  const now = await renderMarkdown(settings.now_md);
  const name = settings.full_name || "Doğukan Topçu";

  return (
    <>
      <PageHead title={name} lede={settings.headline || undefined} />

      <div className="wrap about">
        <div className="about__portrait">
          <Lamp>
            <Frame
              src={settings.avatar_url}
              alt={settings.avatar_alt}
              placeholder="Portrait goes here"
              ratio="4 / 5"
              sizes="(min-width: 900px) 24rem, 18rem"
              priority
            />
          </Lamp>
          {settings.location && <p className="t-data about__where">{settings.location}</p>}
        </div>

        <div className="about__text">
          {bio.content ? (
            <Prose>{bio.content}</Prose>
          ) : (
            <Empty title="The long version is still a draft" body="This is where the full biography goes. Write it in the admin panel under Settings." />
          )}

          {now.content && (
            <section className="about__now" aria-labelledby="now-title">
              <h2 id="now-title" className="t-h3">
                What I am on right now
              </h2>
              <Prose>{now.content}</Prose>
            </section>
          )}
        </div>
      </div>

      {settings.skills.length > 0 && (
        <section className="wrap about-part" aria-labelledby="skills-title">
          <h2 id="skills-title" className="t-h2 about-part__title">
            What I work with
          </h2>
          <dl className="facts about-skills">
            {settings.skills.map((group) => (
              <div key={group.group} className="facts__row">
                <dt className="facts__key">{group.group}</dt>
                <dd className="facts__value">{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="wrap about-part" aria-labelledby="history-title">
          <h2 id="history-title" className="t-h2 about-part__title">
            Where I have been
          </h2>
          <div className="about-part__body">
            {KIND_ORDER.filter((kind) => experiences.some((e) => e.kind === kind)).map((kind) => (
              <div key={kind} className="history-group">
                <h3 className="t-label history-group__title">{KIND_TITLE[kind]}</h3>
                <ol className="history">
                  {experiences
                    .filter((e) => e.kind === kind)
                    .map((item) => {
                      const years = yearRange(item.start_date, item.end_date, item.is_current);
                      return (
                        <li key={item.id} className="history__row">
                          {years && <p className="history__when nums">{years}</p>}
                          <div className="history__body">
                            <h4 className="history__title">
                              {item.url ? (
                                <a className="history__link" href={item.url} target="_blank" rel="noopener noreferrer">
                                  {item.title}
                                </a>
                              ) : (
                                item.title
                              )}
                            </h4>
                            {item.organization && (
                              <p className="history__where">
                                {item.organization}
                                {item.location ? `, ${item.location}` : ""}
                              </p>
                            )}
                            {item.summary && <p className="history__summary">{item.summary}</p>}
                            {item.highlights.length > 0 && (
                              <ul className="history__highlights">
                                {item.highlights.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {settings.interests.length > 0 && (
        <section className="wrap about-part" aria-labelledby="interests-title">
          <h2 id="interests-title" className="t-h2 about-part__title">
            Away from the keyboard
          </h2>
          <p className="t-lede about-part__body about__interests">{settings.interests.join(". ")}.</p>
        </section>
      )}

      <section className="wrap about-close" aria-labelledby="close-title">
        <h2 id="close-title" className="about-close__line">
          Working on something interesting?
        </h2>
        <a className="btn btn--primary" href={contactHref(settings)}>
          {CONTACT_LABEL}
        </a>
      </section>
    </>
  );
}
