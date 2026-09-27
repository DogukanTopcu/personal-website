import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/Markdown";
import { Empty } from "@/components/site/Empty";
import { count, runtimeShort } from "@/components/site/format";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import { PageHead } from "@/components/site/PageHead";
import { getCourse, listCourses } from "@/lib/data/courses";
import { minutes } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown/render";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = true;

const LEVEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const RELATION: Record<string, string> = { prerequisite: "Take this first", next: "Take this next", related: "Related" };

export async function generateStaticParams() {
  const courses = await listCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const course = await getCourse(slug);
  if (!course) return { title: "Not found" };
  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { type: "article", title: course.title, description: course.summary, ...(course.cover_url ? { images: [course.cover_url] } : {}) },
  };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const { content } = await renderMarkdown(course.description_md);
  const total = course.lessons.reduce((n, l) => n + (l.reading_minutes ?? 1), 0);
  const sections = [...new Set(course.lessons.map((l) => l.section_title).filter(Boolean))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url: `${siteUrl()}/courses/${course.slug}`,
    educationalLevel: LEVEL[course.level] ?? course.level,
    hasPart: course.lessons.map((l) => ({ "@type": "LearningResource", name: l.title, url: `${siteUrl()}/courses/${course.slug}/${l.slug}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHead
        crumbs={[{ href: "/courses", label: "Courses" }, { label: course.title }]}
        title={course.title}
        lede={course.summary}
        meta={
          <p className="t-data">
            {LEVEL[course.level] ?? course.level}
            {course.lessons.length > 0 && ` · ${count(course.lessons.length, "lesson")} · ${minutes(total)}`}
          </p>
        }
      />

      <div className="wrap">
        {course.cover_url && (
          <Lamp className="detail-gate">
            <Frame
              src={course.cover_url}
              alt={course.cover_alt}
              placeholder="Cover image"
              ratio={null}
              className="gate"
              sizes="(min-width: 1360px) 1250px, 100vw"
              priority
            />
          </Lamp>
        )}

        <div className="course-detail">
          {content && (
            <div className="course-detail__main">
              <Prose className="detail-prose">{content}</Prose>
            </div>
          )}

          <aside className="course-detail__aside" aria-labelledby="course-lessons-title">
            <h2 id="course-lessons-title" className="t-label course-detail__label">
              Lessons
            </h2>
            {course.lessons.length === 0 ? (
              <Empty title="No lessons yet" body="The lessons for this course are still being written." />
            ) : (
              <ol className="contents">
                {course.lessons.map((lesson, index) => {
                  const isNewSection = lesson.section_title && lesson.section_title !== course.lessons[index - 1]?.section_title;
                  return (
                    <li key={lesson.id}>
                      {isNewSection && sections.length > 1 && <p className="contents__section">{lesson.section_title}</p>}
                      <Link className="contents__item" href={`/courses/${course.slug}/${lesson.slug}`}>
                        <span className="contents__number nums">{String(index + 1).padStart(2, "0")}</span>
                        <span className="contents__title">
                          {lesson.title}
                          {lesson.summary && <span className="contents__summary">{lesson.summary}</span>}
                        </span>
                        <span className="contents__meta nums">{runtimeShort(lesson.reading_minutes)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
            {course.lessons[0] && (
              <Link className="btn btn--primary course-start" href={`/courses/${course.slug}/${course.lessons[0].slug}`}>
                Start the course
              </Link>
            )}
          </aside>

          {course.links.length > 0 && (
            <section className="course-links" aria-labelledby="course-links-title">
              <h2 id="course-links-title" className="t-h3 course-links__title">
                Around this course
              </h2>
              <ul className="index">
                {course.links.map((link) => (
                  <li key={`${link.relation}-${link.course.slug}`}>
                    <article className="entry">
                      <p className="entry__aside">{RELATION[link.relation]}</p>
                      <div>
                        <h3 className="entry__title">
                          <Link href={`/courses/${link.course.slug}`}>{link.course.title}</Link>
                        </h3>
                        <p className="entry__body">{link.course.summary}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
