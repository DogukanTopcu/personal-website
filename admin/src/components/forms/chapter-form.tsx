"use client";

import { EditorFrame, FieldGroup } from "@/components/content/editor-frame";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveChapter } from "@/lib/actions/stories";
import { publicPaths } from "@/lib/paths";
import type { ChapterInput } from "@/lib/schemas";

type ChapterFormProps = {
  story: { id: string; slug: string; title: string; live: boolean };
  id: string | null;
  initial: ChapterInput;
  /** Part titles already used in the story. */
  parts: string[];
};

export function ChapterForm({ story, id, initial, parts }: ChapterFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: `chapters:${story.id}`,
    save: (chapterId, values) => saveChapter(story.id, chapterId, values),
    editPath: (chapterId) => `/stories/${story.id}/chapters/${chapterId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<ChapterInput>(id, set);

  return (
    <EditorFrame
      backHref={`/stories/${story.id}`}
      backLabel={story.title}
      eyebrow={id ? "Edit chapter" : "New chapter"}
      title={values.title || "Untitled chapter"}
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
          publicPath={saved.id ? publicPaths.chapter(story.slug, saved.slug) : null}
          parentPublished={story.live}
        />
      }
    >
      <FieldGroup>
        <div data-field="title">
          <Field label="Title" required error={fieldError("title")}>
            <Input value={values.title} onChange={(event) => slug.setTitle(event.target.value)} autoFocus={!id} />
          </Field>
        </div>
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix={`/stories/${story.slug}/`} />
        <div data-field="part_title">
          <Field label="Part" helper="Groups chapters into parts. Reuse a name to add to that part." error={fieldError("part_title")}>
            <Input value={values.part_title} onChange={(event) => set({ part_title: event.target.value })} list="chapter-parts" />
          </Field>
          <datalist id="chapter-parts">
            {parts.map((part) => (
              <option key={part} value={part} />
            ))}
          </datalist>
        </div>
      </FieldGroup>

      <FieldGroup title="Chapter">
        <div data-field="content_md">
          <Field label="Text" as="group" error={fieldError("content_md")}>
            <MarkdownEditor value={values.content_md} onChange={(content_md) => set({ content_md })} storageKey={editor.storageKey} minHeight={560} placeholder="Once upon a time." />
          </Field>
        </div>
      </FieldGroup>
    </EditorFrame>
  );
}
