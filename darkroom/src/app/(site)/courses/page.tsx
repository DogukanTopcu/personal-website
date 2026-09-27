import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { count, runtimeShort } from "@/components/site/format";
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
 * A course is a set, so the index shows the set: every course is laid out as
 * its syllabus, the course on the left and its numbered lessons on the right.
 * A grid of course cards would hide the one thing a reader actually wants to
 * know, which is what is inside.
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
                <article key={course.id} className="course" aria-labelledby={`course-${course.slug}`}>
                  <header className="course__head">
                    <h2 id={`course-${course.slug}`} className="course__title">
                      <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                    </h2>
                    <p className="t-data course__meta">
                      {LEVEL[course.level] ?? course.level}
                      {course.lessons.length > 0 && ` · ${count(course.lessons.length, "lesson")} · ${minutes(total)}`}
                    </p>
                    <p className="course__summary">{course.summary}</p>
                    {course.topics.length > 0 && (
                      <ul className="tags course__topics">
                        {course.topics.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </header>

                  {course.lessons.length > 0 ? (
                    <ol className="contents course__contents" aria-label={`Lessons in ${course.title}`}>
                      {course.lessons.map((lesson, index) => {
                        const isNewSection = lesson.section_title && lesson.section_title !== course.lessons[index - 1]?.section_title;
                        return (
                          <li key={lesson.id}>
                            {isNewSection && sections.length > 1 && <p className="contents__section">{lesson.section_title}</p>}
                            <Link className="contents__item" href={`/courses/${course.slug}/${lesson.slug}`}>
                              <span className="contents__number nums">{String(index + 1).padStart(2, "0")}</span>
                              <span className="contents__title">{lesson.title}</span>
                              <span className="contents__meta nums">{runtimeShort(lesson.reading_minutes)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="t-caption course__pending">The lessons for this course are still being written.</p>
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
