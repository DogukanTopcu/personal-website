import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { listCourses } from "@/lib/data/courses";
import { minutes } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Courses",
  description: "Linked sets of lessons on computer engineering subjects.",
  alternates: { canonical: "/courses" },
};

const LEVEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

/**
 * A course is a set, so the index shows the set: every course opens with its
 * lessons listed under it. A grid of course cards would hide the one thing a
 * reader actually wants to know, which is what is inside.
 */
export default async function CoursesPage() {
  const courses = await listCourses();

  return (
    <>
      <PageHead
        title="Courses"
        lede="Computer engineering subjects, taught in order. Each course is a set of lessons that build on each other."
      />

      <div className="wrap section">
        {courses.length === 0 ? (
          <Empty title="No courses published yet" body="Lesson sets on algorithms, data structures and the rest will appear here." />
        ) : (
          <div className="course-list">
            {courses.map((course) => {
              const total = course.lessons.reduce((n, l) => n + (l.reading_minutes ?? 1), 0);
              const sections = [...new Set(course.lessons.map((l) => l.section_title).filter(Boolean))];
              return (
                <article key={course.id} className="course">
                  <div className="course__head">
                    <p className="entry__aside">
                      {LEVEL[course.level] ?? course.level}
                      {course.lessons.length > 0 && ` · ${course.lessons.length} lesson${course.lessons.length === 1 ? "" : "s"} · ${minutes(total)}`}
                    </p>
                    <h2 className="t-h2">
                      <Link className="link" href={`/courses/${course.slug}`}>
                        {course.title}
                      </Link>
                    </h2>
                    <p className="entry__body">{course.summary}</p>
                    {course.topics.length > 0 && (
                      <ul className="tags entry__foot">
                        {course.topics.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {course.lessons.length > 0 && (
                    <ol className="contents">
                      {course.lessons.map((lesson, index) => {
                        const isNewSection = lesson.section_title && lesson.section_title !== course.lessons[index - 1]?.section_title;
                        return (
                          <li key={lesson.id}>
                            {isNewSection && sections.length > 1 && <p className="contents__section">{lesson.section_title}</p>}
                            <Link className="contents__item" href={`/courses/${course.slug}/${lesson.slug}`}>
                              <span className="contents__number nums">{String(index + 1).padStart(2, "0")}</span>
                              <span className="contents__title">{lesson.title}</span>
                              <span className="contents__meta nums">{minutes(lesson.reading_minutes)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
