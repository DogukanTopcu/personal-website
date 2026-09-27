import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/Markdown";
import { Embed } from "@/components/content/Embed";
import { Toc } from "@/components/content/Toc";
import { PageHead } from "@/components/site/PageHead";
import { Pager } from "@/components/site/Pager";
import { getLesson, listCourses } from "@/lib/data/courses";
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

export default async function LessonPage(props: PageProps<"/courses/[slug]/[lesson]">) {
  const { slug, lesson: lessonSlug } = await props.params;
  const found = await getLesson(slug, lessonSlug);
  if (!found) notFound();

  const { course, lesson, index } = found;
  const { content, toc } = await renderMarkdown(lesson.content_md);
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const video = lesson.video_url ? parseEmbedUrl(lesson.video_url) : null;

  return (
    <>
      <PageHead
        crumbs={[
          { href: "/courses", label: "Courses" },
          { href: `/courses/${course.slug}`, label: course.title },
          { label: lesson.title },
        ]}
        title={lesson.title}
        lede={lesson.summary}
        meta={
          <p className="t-data">
            Lesson <span className="nums">{index + 1}</span> of <span className="nums">{course.lessons.length}</span>
            {lesson.section_title ? ` · ${lesson.section_title}` : ""} · <span className="nums">{minutes(lesson.reading_minutes)}</span>
          </p>
        }
      />

      <div className="wrap">
        <div className="reading lesson">
          <div className="lesson__main">
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
          </div>

          {/* Two rails in the margin: the course and this lesson's contents.
              On a narrow screen the contents stay above the lesson and the
              course rail moves below it, where the next lesson is wanted. */}
          <div className="reading__aside lesson__rails">
            <nav className="toc lesson-rail" aria-label="Lessons in this course">
              <p className="toc__title">{course.title}</p>
              <ol className="toc__list lesson-rail__list">
                {course.lessons.map((item, i) => (
                  <li key={item.id}>
                    <Link href={`/courses/${course.slug}/${item.slug}`} aria-current={i === index ? "true" : undefined}>
                      <span className="nums lesson-rail__n">{String(i + 1).padStart(2, "0")}</span>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <Toc entries={toc} />
          </div>
        </div>
      </div>
    </>
  );
}
