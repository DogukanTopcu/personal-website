import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Embed } from "@/components/content/Embed";
import { Prose } from "@/components/content/Markdown";
import { Toc } from "@/components/content/Toc";
import { Pager } from "@/components/site/Pager";
import { getLesson, listCourses } from "@/lib/data/courses";
import type { LessonCard } from "@/lib/data/types";
import { minutes } from "@/lib/format";
import { parseEmbedUrl } from "@/lib/markdown/plugins";
import { renderMarkdown } from "@/lib/markdown/render";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const courses = await listCourses();
  return courses.flatMap((course) => course.lessons.map((lesson) => ({ slug: course.slug, lesson: lesson.slug })));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]/[lesson]">): Promise<Metadata> {
  const { slug, lesson } = await props.params;
  const found = await getLesson(slug, lesson);
  if (!found) return { title: "Not found" };
  return {
    title: `${found.lesson.title} · ${found.course.title}`,
    description: found.lesson.summary,
    alternates: { canonical: `/courses/${slug}/${lesson}` },
  };
}

/** Every lesson in the course, grouped by section when there is more than one. */
function LessonList({ courseSlug, lessons, current }: { courseSlug: string; lessons: LessonCard[]; current: number }) {
  const sections = new Set(lessons.map((l) => l.section_title).filter(Boolean));
  return (
    <ol className="lesson-rail__list">
      {lessons.map((item, i) => {
        const opensSection = sections.size > 1 && item.section_title && item.section_title !== lessons[i - 1]?.section_title;
        return (
          <li key={item.id}>
            {opensSection && <p className="lesson-rail__section">{item.section_title}</p>}
            <Link href={`/courses/${courseSlug}/${item.slug}`} aria-current={i === current ? "page" : undefined}>
              <span className="lesson-rail__n nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A lesson reads like documentation: the course on the left, the lesson in
 * the middle, its headings on the right. On narrower screens the course folds
 * into a disclosure above the text and the headings are left out.
 */
export default async function LessonPage(props: PageProps<"/courses/[slug]/[lesson]">) {
  const { slug, lesson: lessonSlug } = await props.params;
  const found = await getLesson(slug, lessonSlug);
  if (!found) notFound();

  const { course, lesson, index } = found;
  const { content, toc } = await renderMarkdown(lesson.content_md);
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const video = lesson.video_url ? parseEmbedUrl(lesson.video_url) : null;
  const total = course.lessons.length;

  return (
    <div className="lesson-layout">
      <nav className="lesson-layout__left" aria-label="Lessons in this course">
        <Link className="lesson-rail__course" href={`/courses/${course.slug}`}>
          {course.title}
        </Link>
        <LessonList courseSlug={course.slug} lessons={course.lessons} current={index} />
      </nav>

      <article className="lesson-layout__main">
        <header className="lesson-head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/courses">Courses</Link>
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
            <Link href={`/courses/${course.slug}`}>{course.title}</Link>
          </nav>
          <h1 className="t-h1 page-head__title">{lesson.title}</h1>
          {lesson.summary && <p className="t-lede page-head__lede">{lesson.summary}</p>}
          <p className="t-data page-head__meta">
            Lesson <span className="nums">{index + 1}</span> of <span className="nums">{total}</span>
            {lesson.section_title ? ` · ${lesson.section_title}` : ""} · {minutes(lesson.reading_minutes)}
          </p>
        </header>

        <details className="lesson-outline">
          <summary>
            <span>Lessons in this course</span>
          </summary>
          <div className="lesson-outline__body">
            <LessonList courseSlug={course.slug} lessons={course.lessons} current={index} />
          </div>
        </details>

        {video && (
          <div className="lesson-video">
            <Embed provider={video.provider} id={video.id} title={lesson.title} />
          </div>
        )}
        {lesson.video_url && !video && (
          <p className="t-small lesson-video">
            <a className="link" href={lesson.video_url} target="_blank" rel="noopener noreferrer">
              Watch the video for this lesson
            </a>
          </p>
        )}

        {content && <Prose className="detail-prose">{content}</Prose>}

        <Pager
          previous={previous ? { href: `/courses/${course.slug}/${previous.slug}`, title: previous.title } : null}
          next={next ? { href: `/courses/${course.slug}/${next.slug}`, title: next.title } : null}
          previousLabel="Previous lesson"
          nextLabel="Next lesson"
        />

        {!next && (
          <p className="lesson-end t-small">
            That is the end of {course.title}.{" "}
            <Link className="link" href={`/courses/${course.slug}`}>
              Back to the course
            </Link>
            .
          </p>
        )}
      </article>

      <aside className="lesson-layout__right">
        <Toc entries={toc} />
      </aside>
    </div>
  );
}
