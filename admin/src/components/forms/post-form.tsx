"use client";

import { CoverField } from "@/components/content/cover-field";
import { EditorFrame, FieldGroup, PanelSection } from "@/components/content/editor-frame";
import { PublishPanel } from "@/components/content/publish-panel";
import { SlugField } from "@/components/content/slug-field";
import { useContentEditor, useSlugField } from "@/components/content/use-content-editor";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { savePost } from "@/lib/actions/posts";
import { publicPaths } from "@/lib/paths";
import type { PostInput } from "@/lib/schemas";
import { EMPTY_REVIEW, REVIEW_CATEGORY_SLUGS, type Review, type ReviewCategorySlug } from "@/lib/types";

export type CategoryOption = { id: string; name: string; slug: string };

type PostFormProps = {
  id: string | null;
  initial: PostInput;
  categories: CategoryOption[];
};

const REVIEW_LABELS: Record<ReviewCategorySlug, { subject: string; creator: string }> = {
  books: { subject: "Book", creator: "Author" },
  films: { subject: "Film", creator: "Director" },
  games: { subject: "Game", creator: "Studio" },
};

export function PostForm({ id, initial, categories }: PostFormProps) {
  const editor = useContentEditor({
    initial,
    id,
    table: "posts",
    save: savePost,
    editPath: (postId) => `/posts/${postId}`,
  });
  const { values, set, saved, fieldError } = editor;
  const slug = useSlugField<PostInput>(id, set);

  const category = categories.find((entry) => entry.id === values.category_id) ?? null;
  const reviewKind = category && (REVIEW_CATEGORY_SLUGS as readonly string[]).includes(category.slug) ? (category.slug as ReviewCategorySlug) : null;
  const review: Review = values.review ?? EMPTY_REVIEW;

  function setReview(patch: Partial<Review>) {
    set({ review: { ...review, ...patch } });
  }

  function submit(status?: PostInput["status"]) {
    // The review only belongs to review categories; drop it otherwise.
    if (!reviewKind && values.review) set({ review: null });
    void editor.submit(status);
  }

  return (
    <EditorFrame
      backHref="/posts"
      backLabel="Posts"
      eyebrow={id ? "Edit post" : "New post"}
      title={values.title || "Untitled post"}
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
            onSubmit={submit}
            publicPath={saved.id ? publicPaths.post(saved.slug) : null}
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
            <div data-field="tags">
              <Field label="Tags" helper="Enter or comma adds a tag." error={fieldError("tags")}>
                <TagInput value={values.tags} onChange={(tags) => set({ tags })} placeholder="Add a tag" />
              </Field>
            </div>
            <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Pinned" description="Kept at the top of Writing on the home page, whatever its date." />
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
        <SlugField value={values.slug} onChange={slug.setSlug} onRegenerate={() => slug.regenerate(values.title)} touched={slug.touched} error={fieldError("slug")} prefix="/blog/" />
        <div data-field="excerpt">
          <Field label="Excerpt" helper="One or two sentences for lists and link previews." error={fieldError("excerpt")} aside={`${values.excerpt.length} / 4000`}>
            <Textarea value={values.excerpt} onChange={(event) => set({ excerpt: event.target.value })} rows={3} />
          </Field>
        </div>
      </FieldGroup>

      {reviewKind ? (
        <FieldGroup title="Review">
          <div className="grid gap-4 sm:grid-cols-2">
            <div data-field="review.subject">
              <Field label={`${REVIEW_LABELS[reviewKind].subject} title`} error={fieldError("review.subject")}>
                <Input value={review.subject} onChange={(event) => setReview({ subject: event.target.value })} />
              </Field>
            </div>
            <div data-field="review.creator">
              <Field label={REVIEW_LABELS[reviewKind].creator} error={fieldError("review.creator")}>
                <Input value={review.creator} onChange={(event) => setReview({ creator: event.target.value })} />
              </Field>
            </div>
            <div data-field="review.year">
              <Field label="Year" error={fieldError("review.year")}>
                <Input
                  type="number"
                  mono
                  inputMode="numeric"
                  value={review.year ?? ""}
                  onChange={(event) => setReview({ year: event.target.value === "" ? null : Number(event.target.value) })}
                />
              </Field>
            </div>
            <div data-field="review.rating">
              <Field label="Rating" helper="0 to 10 in steps of 0.5." error={fieldError("review.rating")}>
                <Input
                  type="number"
                  mono
                  min={0}
                  max={10}
                  step={0.5}
                  value={review.rating ?? ""}
                  onChange={(event) => setReview({ rating: event.target.value === "" ? null : Number(event.target.value) })}
                />
              </Field>
            </div>
          </div>
          <div data-field="review.verdict">
            <Field label="Verdict" helper="One line that sums it up." error={fieldError("review.verdict")}>
              <Textarea value={review.verdict} onChange={(event) => setReview({ verdict: event.target.value })} rows={2} />
            </Field>
          </div>
        </FieldGroup>
      ) : null}

      <FieldGroup title="Content">
        <div data-field="content_md">
          <Field label="Body" as="group" error={fieldError("content_md")}>
            <MarkdownEditor value={values.content_md} onChange={(content_md) => set({ content_md })} storageKey={editor.storageKey} />
          </Field>
        </div>
      </FieldGroup>
    </EditorFrame>
  );
}
