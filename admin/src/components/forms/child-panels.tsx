"use client";

import { removeLesson, reorderLessons } from "@/lib/actions/courses";
import { removeChapter, reorderChapters } from "@/lib/actions/stories";
import type { ChapterListRow } from "@/lib/data/chapters";
import type { LessonListRow } from "@/lib/data/lessons";
import { ChildList, type ChildRow } from "./child-list";

/** The lessons of one course, under the course form. */
export function LessonsPanel({ courseId, lessons }: { courseId: string; lessons: LessonListRow[] }) {
  const rows: ChildRow[] = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    group: lesson.section_title,
    status: lesson.status,
    published_at: lesson.published_at,
    reading_minutes: lesson.reading_minutes,
  }));

  return (
    <ChildList
      title="Lessons"
      noun="lesson"
      rows={rows}
      newHref={`/courses/${courseId}/lessons/new`}
      editHref={(id) => `/courses/${courseId}/lessons/${id}`}
      onReorder={(ids) => reorderLessons(courseId, ids)}
      onDelete={removeLesson}
      emptyText="Lessons will be listed here in the order students take them."
    />
  );
}

/** The chapters of one story, under the story form. */
export function ChaptersPanel({ storyId, chapters }: { storyId: string; chapters: ChapterListRow[] }) {
  const rows: ChildRow[] = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    slug: chapter.slug,
    group: chapter.part_title,
    status: chapter.status,
    published_at: chapter.published_at,
    reading_minutes: chapter.reading_minutes,
  }));

  return (
    <ChildList
      title="Chapters"
      noun="chapter"
      rows={rows}
      newHref={`/stories/${storyId}/chapters/new`}
      editHref={(id) => `/stories/${storyId}/chapters/${id}`}
      onReorder={(ids) => reorderChapters(storyId, ids)}
      onDelete={removeChapter}
      emptyText="Chapters will be listed here in reading order."
    />
  );
}
