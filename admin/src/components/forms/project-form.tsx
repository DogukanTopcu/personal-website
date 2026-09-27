"use client";

import { CoverField } from "@/components/content/cover-field";
import { EditorFrame, FieldGroup, PanelSection } from "@/components/content/editor-frame";
import { ImageListField } from "@/components/content/image-list-field";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { saveProject } from "@/lib/actions/projects";
import { publicPaths } from "@/lib/paths";
import type { ProjectInput } from "@/lib/schemas";
import type { CategoryOption } from "./post-form";

type ProjectFormProps = {
  id: string | null;
  initial: ProjectInput;
  categories: CategoryOption[];
};

export function ProjectForm({ id, initial, categories }: ProjectFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: "projects",
    save: saveProject,
    editPath: (projectId) => `/projects/${projectId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<ProjectInput>(id, set);

  return (
    <EditorFrame
      backHref="/projects"
      backLabel="Projects"
      eyebrow={id ? "Edit project" : "New project"}
      title={values.title || "Untitled project"}
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
            publicPath={saved.id ? publicPaths.project(saved.slug) : null}
          />

          <PanelSection title="Details">
            <div data-field="category_id">
              <Field label="Category" error={fieldError("category_id")}>
                <Select value={values.category_id ?? ""} onChange={(event) => set({ category_id: event.target.value || null })}>
                  <option value="">No category</option>
                  {categories.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div data-field="role">
              <Field label="Role" helper="What you did, such as Lead engineer." error={fieldError("role")}>
                <Input value={values.role} onChange={(event) => set({ role: event.target.value })} />
              </Field>
            </div>
            <div data-field="tech">
              <Field label="Tech" helper="Enter or comma adds an entry." error={fieldError("tech")}>
                <TagInput value={values.tech} onChange={(tech) => set({ tech })} placeholder="TypeScript, Unity, ..." />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div data-field="started_on">
                <Field label="Started" error={fieldError("started_on")}>
                  <Input type="date" mono value={values.started_on ?? ""} onChange={(event) => set({ started_on: event.target.value || null })} />
                </Field>
              </div>
              <div data-field="ended_on">
                <Field label="Ended" error={fieldError("ended_on")}>
                  <Input
                    type="date"
                    mono
                    value={values.ended_on ?? ""}
                    disabled={values.is_ongoing}
                    onChange={(event) => set({ ended_on: event.target.value || null })}
                  />
                </Field>
              </div>
            </div>
            <Switch checked={values.is_ongoing} onCheckedChange={(is_ongoing) => set({ is_ongoing })} label="Ongoing" description="Clears the end date." />
            <div data-field="repo_url">
              <Field label="Repository URL" error={fieldError("repo_url")}>
                <Input type="url" mono value={values.repo_url ?? ""} onChange={(event) => set({ repo_url: event.target.value || null })} placeholder="https://github.com/..." />
              </Field>
            </div>
            <div data-field="live_url">
              <Field label="Live URL" error={fieldError("live_url")}>
                <Input type="url" mono value={values.live_url ?? ""} onChange={(event) => set({ live_url: event.target.value || null })} placeholder="https://" />
              </Field>
            </div>
            <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Featured" description="Listed first under Projects on the home page." />
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
              helper="Falls back to the category cover when empty."
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
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix="/projects/" />
        <div data-field="summary">
          <Field label="Summary" helper="One or two sentences for lists and link previews." error={fieldError("summary")} aside={`${values.summary.length} / 4000`}>
            <Textarea value={values.summary} onChange={(event) => set({ summary: event.target.value })} rows={3} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Write-up">
        <div data-field="content_md">
          <Field label="Body" as="group" error={fieldError("content_md")}>
            <MarkdownEditor value={values.content_md} onChange={(content_md) => set({ content_md })} storageKey={editor.storageKey} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Gallery">
        <ImageListField
          label="Images"
          helper="Shown on the project page in this order. Drag to reorder."
          value={values.gallery}
          onChange={(gallery) => set({ gallery })}
          errorFor={fieldError}
          fieldKey="gallery"
        />
      </FieldGroup>
    </EditorFrame>
  );
}
