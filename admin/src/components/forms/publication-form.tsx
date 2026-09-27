"use client";

import { EditorFrame, FieldGroup, PanelSection } from "@/components/content/editor-frame";
import { FileField } from "@/components/content/file-field";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { savePublication } from "@/lib/actions/publications";
import { publicPaths } from "@/lib/paths";
import type { PublicationInput } from "@/lib/schemas";
import { LABELS, PUBLICATION_KINDS } from "@/lib/types";

type PublicationFormProps = {
  id: string | null;
  initial: PublicationInput;
};

export function PublicationForm({ id, initial }: PublicationFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: "publications",
    save: savePublication,
    editPath: (publicationId) => `/publications/${publicationId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<PublicationInput>(id, set);

  return (
    <EditorFrame
      backHref="/publications"
      backLabel="Publications"
      eyebrow={id ? "Edit publication" : "New publication"}
      title={values.title || "Untitled publication"}
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
            publicPath={saved.id ? publicPaths.publication(saved.slug) : null}
          />

          <PanelSection title="Details">
            <div data-field="kind">
              <Field label="Kind" error={fieldError("kind")}>
                <Select value={values.kind} onChange={(event) => set({ kind: event.target.value as PublicationInput["kind"] })}>
                  {PUBLICATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {LABELS.publicationKind[kind]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div data-field="venue">
              <Field label="Venue" helper="Journal, conference or institution." error={fieldError("venue")}>
                <Input value={values.venue} onChange={(event) => set({ venue: event.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div data-field="year">
                <Field label="Year" required error={fieldError("year")}>
                  <Input
                    type="number"
                    mono
                    inputMode="numeric"
                    value={values.year ?? ""}
                    onChange={(event) => set({ year: event.target.value === "" ? null : Number(event.target.value) })}
                  />
                </Field>
              </div>
              <div data-field="published_on">
                <Field label="Published on" error={fieldError("published_on")}>
                  <Input type="date" mono value={values.published_on ?? ""} onChange={(event) => set({ published_on: event.target.value || null })} />
                </Field>
              </div>
            </div>
            <div data-field="doi">
              <Field label="DOI" error={fieldError("doi")}>
                <Input mono value={values.doi} onChange={(event) => set({ doi: event.target.value })} placeholder="10.1000/xyz123" />
              </Field>
            </div>
            <div data-field="url">
              <Field label="URL" helper="Publisher page, arXiv, or similar." error={fieldError("url")}>
                <Input type="url" mono value={values.url ?? ""} onChange={(event) => set({ url: event.target.value || null })} placeholder="https://" />
              </Field>
            </div>
            <FileField label="PDF" value={values.pdf_url} onChange={(pdf_url) => set({ pdf_url })} error={fieldError("pdf_url")} fieldKey="pdf_url" />
            <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Featured" description="Listed first under Research on the home page." />
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
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix="/research/" />
        <div data-field="authors">
          <Field label="Authors" helper="In order. Enter or comma adds an author." error={fieldError("authors")}>
            <TagInput value={values.authors} onChange={(authors) => set({ authors })} placeholder="Doğukan Topçu" />
          </Field>
        </div>
        <div data-field="abstract">
          <Field label="Abstract" error={fieldError("abstract")} aside={`${values.abstract.length} / 12000`}>
            <Textarea value={values.abstract} onChange={(event) => set({ abstract: event.target.value })} rows={10} />
          </Field>
        </div>
        <div data-field="keywords">
          <Field label="Keywords" helper="Enter or comma adds a keyword." error={fieldError("keywords")}>
            <TagInput value={values.keywords} onChange={(keywords) => set({ keywords })} placeholder="Add a keyword" />
          </Field>
        </div>
        <div data-field="bibtex">
          <Field label="BibTeX" helper="Shown as a copyable citation." error={fieldError("bibtex")}>
            <Textarea mono value={values.bibtex} onChange={(event) => set({ bibtex: event.target.value })} rows={8} spellCheck={false} />
          </Field>
        </div>
      </FieldGroup>
    </EditorFrame>
  );
}
