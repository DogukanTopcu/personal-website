"use client";

import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { CoverField } from "@/components/content/cover-field";
import { EditorFrame, FieldGroup, PanelSection } from "@/components/content/editor-frame";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { saveCourse } from "@/lib/actions/courses";
import type { CourseOption } from "@/lib/data/courses";
import { publicPaths } from "@/lib/paths";
import type { CourseInput } from "@/lib/schemas";
import { COURSE_LEVELS, COURSE_RELATIONS, LABELS, type CourseRelation } from "@/lib/types";

type CourseFormProps = {
  id: string | null;
  initial: CourseInput;
  /** Every other course, for the links section. */
  courses: CourseOption[];
  /** The lessons panel, rendered under the fields once the course exists. */
  lessons?: ReactNode;
};

export function CourseForm({ id, initial, courses, lessons }: CourseFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: "courses",
    save: saveCourse,
    editPath: (courseId) => `/courses/${courseId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<CourseInput>(id, set);
  const options = courses.filter((course) => course.id !== id);

  function setLink(index: number, patch: Partial<CourseInput["links"][number]>) {
    set({ links: values.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) });
  }

  return (
    <EditorFrame
      backHref="/courses"
      backLabel="Courses"
      eyebrow={id ? "Edit course" : "New course"}
      title={values.title || "Untitled course"}
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
            publicPath={saved.id ? publicPaths.course(saved.slug) : null}
          />

          <PanelSection title="Details">
            <div data-field="level">
              <Field label="Level" error={fieldError("level")}>
                <Select value={values.level} onChange={(event) => set({ level: event.target.value as CourseInput["level"] })}>
                  {COURSE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {LABELS.level[level]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div data-field="topics">
              <Field label="Topics" helper="Enter or comma adds a topic." error={fieldError("topics")}>
                <TagInput value={values.topics} onChange={(topics) => set({ topics })} placeholder="Add a topic" />
              </Field>
            </div>
            <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Featured" description="Listed first under Courses on the home page." />
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
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix="/courses/" />
        <div data-field="summary">
          <Field label="Summary" helper="One or two sentences for the course list." error={fieldError("summary")} aside={`${values.summary.length} / 4000`}>
            <Textarea value={values.summary} onChange={(event) => set({ summary: event.target.value })} rows={3} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Description">
        <div data-field="description_md">
          <Field label="Description" as="group" helper="The course page: what it covers, who it is for, what you need." error={fieldError("description_md")}>
            <MarkdownEditor value={values.description_md} onChange={(description_md) => set({ description_md })} storageKey={editor.storageKey} minHeight={360} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Related courses">
        <div data-field="links">
          <Field label="Links to other courses" as="group" helper="What to take before, what to take next, what is related." error={fieldError("links")}>
            <div className="flex flex-col gap-2">
              {values.links.map((link, index) => (
                <div key={index} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <Select
                    aria-label="Relation"
                    className="sm:w-40"
                    value={link.relation}
                    onChange={(event) => setLink(index, { relation: event.target.value as CourseRelation })}
                  >
                    {COURSE_RELATIONS.map((relation) => (
                      <option key={relation} value={relation}>
                        {LABELS.relation[relation]}
                      </option>
                    ))}
                  </Select>
                  <div className="min-w-0 flex-1" data-field={`links.${index}.linked_course_id`}>
                    <Select
                      aria-label="Course"
                      aria-invalid={fieldError(`links.${index}.linked_course_id`) ? true : undefined}
                      value={link.linked_course_id}
                      onChange={(event) => setLink(index, { linked_course_id: event.target.value })}
                    >
                      <option value="">Pick a course</option>
                      {options.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                          {course.status !== "published" ? ` (${LABELS.status[course.status]})` : ""}
                        </option>
                      ))}
                    </Select>
                    {fieldError(`links.${index}.linked_course_id`) ? (
                      <p className="mt-1 text-xs text-error">{fieldError(`links.${index}.linked_course_id`)}</p>
                    ) : null}
                  </div>
                  <Button variant="ghost" icon aria-label="Remove link" onClick={() => set({ links: values.links.filter((_, i) => i !== index) })}>
                    <X size={14} aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  size="sm"
                  disabled={options.length === 0}
                  onClick={() => set({ links: [...values.links, { linked_course_id: "", relation: "related" }] })}
                >
                  Add link
                </Button>
                {options.length === 0 ? <p className="mt-2 text-xs text-ink-soft">Create another course first.</p> : null}
              </div>
            </div>
          </Field>
        </div>
      </FieldGroup>

      {lessons}
    </EditorFrame>
  );
}
