import type { Metadata } from "next";
import { Prose } from "@/components/content/Markdown";
import { Empty } from "@/components/site/Empty";
import { Frame } from "@/components/site/Frame";
import { PageHead } from "@/components/site/PageHead";
import { Reveal } from "@/components/site/Reveal";
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
          <Frame
            src={settings.avatar_url}
            alt={settings.avatar_alt}
            placeholder="Portrait goes here"
            ratio="4 / 5"
            sizes="(min-width: 900px) 24rem, 100vw"
            priority
          />
          {settings.location && <p className="t-data about__where">{settings.location}</p>}
        </div>

        <div className="about__text">
          {bio.content ? <Prose>{bio.content}</Prose> : <Empty title="The long version is still a draft" body="This is where the full biography goes. Write it in the admin panel under Settings." />}

          {now.content && (
            <section className="about__now">
              <h2 className="t-h2">What I am on right now</h2>
              <Prose>{now.content}</Prose>
            </section>
          )}
        </div>
      </div>

      {settings.skills.length > 0 && (
        <section className="wrap section about__skills">
          <h2 className="t-h2">What I work with</h2>
          <Reveal className="about__skill-grid" stagger={50}>
            {settings.skills.map((group) => (
              <div key={group.group}>
                <h3 className="facts__key about__skill-key">{group.group}</h3>
                <p className="about__skill-items">{group.items.join(", ")}</p>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="wrap section about__history">
          <h2 className="t-h2">Where I have been</h2>
          {KIND_ORDER.filter((kind) => experiences.some((e) => e.kind === kind)).map((kind) => (
            <div key={kind} className="about__history-group">
              <h3 className="facts__key">{KIND_TITLE[kind]}</h3>
              <ul className="index">
                {experiences
                  .filter((e) => e.kind === kind)
                  .map((item) => (
                    <li key={item.id}>
                      <article className="entry">
                        <p className="entry__aside">{yearRange(item.start_date, item.end_date, item.is_current) || " "}</p>
                        <div>
                          <h4 className="entry__title">
                            {item.url ? (
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                {item.title}
                              </a>
                            ) : (
                              item.title
                            )}
                          </h4>
                          {item.organization && <p className="entry__body">{item.organization}{item.location ? `, ${item.location}` : ""}</p>}
                          {item.summary && <p className="entry__body">{item.summary}</p>}
                          {item.highlights.length > 0 && (
                            <ul className="about__highlights">
                              {item.highlights.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </article>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {settings.interests.length > 0 && (
        <section className="wrap section">
          <h2 className="t-h2">Away from the keyboard</h2>
          <p className="t-lede about__interests">{settings.interests.join(". ")}.</p>
        </section>
      )}

      <section className="wrap section">
        <div className="about__cta">
          <h2 className="t-h2">Working on something interesting?</h2>
          <a className="btn btn--primary" href={contactHref(settings)}>
            {CONTACT_LABEL}
          </a>
        </div>
      </section>
    </>
  );
}
