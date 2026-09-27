"use client";

import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CoverField } from "@/components/content/cover-field";
import { SortableList } from "@/components/content/sortable-list";
import { useSlugField } from "@/components/content/use-content-editor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { FieldErrors } from "@/lib/action-result";
import { removeCategory, reorderCategories, saveCategory } from "@/lib/actions/categories";
import type { CategoryRow } from "@/lib/data/categories";
import type { CategoryInput } from "@/lib/schemas";
import { CATEGORY_KINDS, LABELS, type CategoryKind } from "@/lib/types";

type Props = { categories: CategoryRow[]; usage: Record<string, number> };

export function CategoriesManager({ categories, usage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [editing, setEditing] = useState<{ row: CategoryRow | null; kind: CategoryKind } | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [pending, startTransition] = useTransition();

  function reorder(kind: CategoryKind, next: CategoryRow[]) {
    const previous = items;
    setItems((current) => [...current.filter((row) => row.kind !== kind), ...next]);
    startTransition(async () => {
      const result = await reorderCategories(next.map((row) => row.id));
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
    });
  }

  function remove() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await removeCategory(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((row) => row.id !== target.id));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${target.name}".`);
      router.refresh();
    });
  }

  const deletingCount = deleting ? (usage[deleting.id] ?? 0) : 0;

  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_KINDS.map((kind) => {
        const group = items.filter((row) => row.kind === kind).sort((a, b) => a.position - b.position);
        return (
          <section key={kind} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">
                {LABELS.categoryKind[kind]} ({group.length})
              </h2>
              <Button size="sm" onClick={() => setEditing({ row: null, kind })}>
                Add
              </Button>
            </div>
            {group.length === 0 ? (
              <EmptyState className="py-6">No {kind} categories yet.</EmptyState>
            ) : (
              <SortableList
                items={group}
                getId={(row) => row.id}
                onReorder={(next) => reorder(kind, next)}
                disabled={pending}
                className="border-y border-hairline-strong"
                itemClassName="border-b border-hairline last:border-b-0 bg-paper"
                renderItem={(row, handle) => (
                  <div className="flex items-center gap-3 py-2 pr-1">
                    <button {...handle} />
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-hairline-strong bg-surface">
                      {row.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- media bucket image
                        <img src={row.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium">{row.name}</p>
                      <p className="truncate font-mono text-[0.6875rem] text-ink-soft">
                        {row.slug} · {usage[row.id] ?? 0} {(usage[row.id] ?? 0) === 1 ? "entry" : "entries"}
                        {row.cover_url ? "" : " · no fallback cover"}
                      </p>
                    </div>
                    <Tooltip label="Edit">
                      <Button variant="ghost" size="sm" icon aria-label={`Edit ${row.name}`} onClick={() => setEditing({ row, kind })}>
                        <PencilSimple size={14} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <Button variant="ghost" size="sm" icon aria-label={`Delete ${row.name}`} onClick={() => setDeleting(row)}>
                        <Trash size={14} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  </div>
                )}
              />
            )}
          </section>
        );
      })}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <CategoryDialog
            row={editing.row}
            kind={editing.kind}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setItems((current) => {
                const exists = current.some((row) => row.id === saved.id);
                return exists ? current.map((row) => (row.id === saved.id ? saved : row)) : [...current, saved];
              });
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : "Delete category?"}
        description={
          deletingCount > 0
            ? `${deletingCount} ${deletingCount === 1 ? "entry uses" : "entries use"} this category. ${deletingCount === 1 ? "It" : "They"} will become uncategorised.`
            : "No entries use this category."
        }
        confirmLabel="Delete category"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

function CategoryDialog({
  row,
  kind,
  onClose,
  onSaved,
}: {
  row: CategoryRow | null;
  kind: CategoryKind;
  onClose: () => void;
  onSaved: (row: CategoryRow) => void;
}) {
  const [values, setValues] = useState<CategoryInput>(
    row
      ? { kind: row.kind as CategoryKind, name: row.name, slug: row.slug, description: row.description, cover_url: row.cover_url }
      : { kind, name: "", slug: "", description: "", cover_url: null },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<CategoryInput>) => setValues((current) => ({ ...current, ...patch }));
  // The slug helper keys off `title`; categories call it `name`.
  const slug = useSlugField<{ title: string; slug: string }>(row?.id ?? null, (patch) => {
    if (patch.title !== undefined) set({ name: patch.title });
    if (patch.slug !== undefined) set({ slug: patch.slug });
  });

  function submit() {
    startTransition(async () => {
      const result = await saveCategory(row?.id ?? null, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(row ? "Category saved." : "Category created.");
      onSaved(result.data);
    });
  }

  return (
    <DialogContent
      title={row ? "Edit category" : `New ${kind} category`}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving" : row ? "Save" : "Create category"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Name" required error={errors.name}>
          <Input value={values.name} onChange={(event) => slug.setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="Slug" required error={errors.slug} helper={kind === "post" ? "Posts in books, films and games get a review section." : undefined}>
          <Input mono value={values.slug} onChange={(event) => slug.setSlug(event.target.value)} />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea value={values.description} onChange={(event) => set({ description: event.target.value })} rows={2} />
        </Field>
        <CoverField
          label="Fallback cover"
          url={values.cover_url}
          alt=""
          withAlt={false}
          onChange={({ url }) => set({ cover_url: url })}
          urlError={errors.cover_url}
          helper="Used by entries in this category that have no cover of their own."
        />
        {formError ? (
          <p role="alert" className="border-l-2 border-error pl-3 text-xs text-error">
            {formError}
          </p>
        ) : null}
      </form>
    </DialogContent>
  );
}
