"use client";

import { EditorFrame, FieldGroup } from "@/components/content/editor-frame";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { saveLesson } from "@/lib/actions/courses";
import { publicPaths } from "@/lib/paths";
import type { LessonInput } from "@/lib/schemas";

type LessonFormProps = {
  course: { id: string; slug: string; title: string; live: boolean };
  id: string | null;
  initial: LessonInput;
  /** Section titles already used in the course. */
  sections: string[];
};

export function LessonForm({ course, id, initial, sections }: LessonFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: `lessons:${course.id}`,
    save: (lessonId, values) => saveLesson(course.id, lessonId, values),
    editPath: (lessonId) => `/courses/${course.id}/lessons/${lessonId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<LessonInput>(id, set);

  return (
    <EditorFrame
      backHref={`/courses/${course.id}`}
      backLabel={course.title}
      eyebrow={id ? "Edit lesson" : "New lesson"}
      title={values.title || "Untitled lesson"}
      side={
        <PublishPanel
          status={values.status}
          publishedAt={values.published_at}
          saved={saved}
          dirty={editor.dirty}
          saving={editor.saving}
          formError={editor.formError}
          errors={{ status: fieldError("status"), published_at: fieldError("published_at") }}
          onStatusChange={(status) => set({ status })}
          onPublishedAtChange={(published_at) => set({ published_at })}
          onSubmit={(status) => void editor.submit(status)}
          publicPath={saved.id ? publicPaths.lesson(course.slug, saved.slug) : null}
          parentPublished={course.live}
        />
      }
    >
      <FieldGroup>
        <div data-field="title">
          <Field label="Title" required error={fieldError("title")}>
            <Input value={values.title} onChange={(event) => slug.setTitle(event.target.value)} autoFocus={!id} />
          </Field>
        </div>
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix={`/courses/${course.slug}/`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="section_title">
            <Field label="Section" helper="Groups lessons into modules. Reuse a name to add to that module." error={fieldError("section_title")}>
              <Input value={values.section_title} onChange={(event) => set({ section_title: event.target.value })} list="lesson-sections" />
            </Field>
            <datalist id="lesson-sections">
              {sections.map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          </div>
          <div data-field="video_url">
            <Field label="Video URL" helper="YouTube, Vimeo or a direct file link." error={fieldError("video_url")}>
              <Input type="url" mono value={values.video_url ?? ""} onChange={(event) => set({ video_url: event.target.value || null })} placeholder="https://" />
            </Field>
          </div>
        </div>
        <div data-field="summary">
          <Field label="Summary" helper="One or two sentences shown in the lesson list." error={fieldError("summary")}>
            <Textarea value={values.summary} onChange={(event) => set({ summary: event.target.value })} rows={2} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Lesson">
        <div data-field="content_md">
          <Field label="Body" as="group" error={fieldError("content_md")}>
            <MarkdownEditor value={values.content_md} onChange={(content_md) => set({ content_md })} storageKey={editor.storageKey} />
          </Field>
        </div>
      </FieldGroup>
    </EditorFrame>
  );
}
