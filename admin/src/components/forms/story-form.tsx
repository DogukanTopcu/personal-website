"use client";

import type { ReactNode } from "react";
import { CoverField } from "@/components/content/cover-field";
import { EditorFrame, FieldGroup, PanelSection } from "@/components/content/editor-frame";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveStory } from "@/lib/actions/stories";
import { publicPaths } from "@/lib/paths";
import type { StoryInput } from "@/lib/schemas";
import { LABELS, STORY_FORMATS } from "@/lib/types";

type StoryFormProps = {
  id: string | null;
  initial: StoryInput;
  chapters?: ReactNode;
};

export function StoryForm({ id, initial, chapters }: StoryFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: "stories",
    save: saveStory,
    editPath: (storyId) => `/stories/${storyId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<StoryInput>(id, set);

  return (
    <EditorFrame
      backHref="/stories"
      backLabel="Stories"
      eyebrow={id ? "Edit story" : "New story"}
      title={values.title || "Untitled story"}
      side={
        <>
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
            publicPath={saved.id ? publicPaths.story(saved.slug) : null}
          />

          <PanelSection title="Details">
            <div data-field="format">
              <Field label="Format" error={fieldError("format")}>
                <Select value={values.format} onChange={(event) => set({ format: event.target.value as StoryInput["format"] })}>
                  {STORY_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {LABELS.format[format]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div data-field="genre">
              <Field label="Genre" error={fieldError("genre")}>
                <Input value={values.genre} onChange={(event) => set({ genre: event.target.value })} placeholder="Science fiction" />
              </Field>
            </div>
            <Switch checked={values.is_complete} onCheckedChange={(is_complete) => set({ is_complete })} label="Complete" description="Off while chapters are still being written." />
            <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Featured" description="Listed first under Stories on the home page." />
            <div data-field="position">
              <Field label="Position" helper="Lower numbers come first in the list." error={fieldError("position")}>
                <Input type="number" mono min={0} value={values.position} onChange={(event) => set({ position: Number(event.target.value) || 0 })} />
              </Field>
            </div>
          </PanelSection>

          <PanelSection title="Cover">
            <CoverField
              url={values.cover_url}
              alt={values.cover_alt}
              onChange={({ url, alt }) => set({ cover_url: url, cover_alt: alt })}
              urlError={fieldError("cover_url")}
              altError={fieldError("cover_alt")}
            />
          </PanelSection>
        </>
      }
    >
      <FieldGroup>
        <div data-field="title">
          <Field label="Title" required error={fieldError("title")}>
            <Input value={values.title} onChange={(event) => slug.setTitle(event.target.value)} autoFocus={!id} />
          </Field>
        </div>
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix="/stories/" />
        <div data-field="synopsis">
          <Field label="Synopsis" helper="What the story is about, without spoiling it." error={fieldError("synopsis")} aside={`${values.synopsis.length} / 4000`}>
            <Textarea value={values.synopsis} onChange={(event) => set({ synopsis: event.target.value })} rows={5} />
          </Field>
        </div>
      </FieldGroup>

      {chapters}
    </EditorFrame>
  );
}
