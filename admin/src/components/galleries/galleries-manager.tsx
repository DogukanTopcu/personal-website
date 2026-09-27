"use client";

import { ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
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
import { removeGallery, reorderGalleries, saveGallery } from "@/lib/actions/galleries";
import type { GalleryRow } from "@/lib/data/galleries";
import { GALLERY_DEFAULTS, toGalleryInput } from "@/lib/inputs";
import { publicPaths, siteUrl } from "@/lib/paths";
import type { GalleryInput } from "@/lib/schemas";

type GalleriesManagerProps = { galleries: GalleryRow[] };

export function GalleriesManager({ galleries }: GalleriesManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(galleries);
  const [editing, setEditing] = useState<GalleryRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<GalleryRow | null>(null);
  const [pending, startTransition] = useTransition();

  function reorder(next: GalleryRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await reorderGalleries(next.map((gallery) => gallery.id));
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
      const result = await removeGallery(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((gallery) => gallery.id !== target.id));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${target.title}".`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEditing("new")}>
          New gallery
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState action={<Button size="sm" onClick={() => setEditing("new")}>Create a gallery</Button>}>
          Galleries such as Drawings or Photography will be listed here.
        </EmptyState>
      ) : (
        <SortableList
          items={items}
          getId={(gallery) => gallery.id}
          onReorder={reorder}
          disabled={pending}
          className="border-y border-hairline-strong"
          itemClassName="border-b border-hairline last:border-b-0 bg-paper"
          renderItem={(gallery, handle) => {
            const count = gallery.gallery_items[0]?.count ?? 0;
            return (
              <div className="flex items-center gap-3 py-2 pr-1">
                <button {...handle} />
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-hairline-strong bg-surface">
                  {gallery.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- media bucket image
                    <img src={gallery.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/galleries/${gallery.id}`} className="block truncate text-[0.8125rem] font-medium hover:underline">
                    {gallery.title}
                  </Link>
                  <span className="block truncate font-mono text-[0.6875rem] text-ink-soft">
                    /gallery/{gallery.slug} · {count} item{count === 1 ? "" : "s"}
                  </span>
                </div>
                <Tooltip label="View on site">
                  <a
                    href={siteUrl(publicPaths.gallery(gallery.slug))}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-ghost btn-sm btn-icon"
                    aria-label={`View ${gallery.title} on site`}
                  >
                    <ArrowSquareOut size={14} aria-hidden="true" />
                  </a>
                </Tooltip>
                <Tooltip label="Edit details">
                  <Button variant="ghost" size="sm" icon aria-label={`Edit ${gallery.title}`} onClick={() => setEditing(gallery)}>
                    <PencilSimple size={14} aria-hidden="true" />
                  </Button>
                </Tooltip>
                <Tooltip label="Delete">
                  <Button variant="ghost" size="sm" icon aria-label={`Delete ${gallery.title}`} onClick={() => setDeleting(gallery)}>
                    <Trash size={14} aria-hidden="true" />
                  </Button>
                </Tooltip>
              </div>
            );
          }}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <GalleryDialog
            gallery={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.title}"?` : "Delete gallery?"}
        description="Every item in the gallery is removed with it. Files stay in the media library."
        confirmLabel="Delete gallery"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

function GalleryDialog({ gallery, onClose, onSaved }: { gallery: GalleryRow | null; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<GalleryInput>(gallery ? toGalleryInput(gallery) : GALLERY_DEFAULTS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<GalleryInput>) => setValues((current) => ({ ...current, ...patch }));
  const slug = useSlugField<GalleryInput>(gallery?.id ?? null, set);

  function submit() {
    startTransition(async () => {
      const result = await saveGallery(gallery?.id ?? null, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(gallery ? "Gallery saved." : "Gallery created.");
      onSaved();
    });
  }

  return (
    <DialogContent
      title={gallery ? "Edit gallery" : "New gallery"}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving" : gallery ? "Save" : "Create gallery"}
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
        <Field label="Title" required error={errors.title}>
          <Input value={values.title} onChange={(event) => slug.setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="Slug" required error={errors.slug} helper="Public path: /gallery/slug">
          <Input mono value={values.slug} onChange={(event) => slug.setSlug(event.target.value)} />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea value={values.description} onChange={(event) => set({ description: event.target.value })} rows={3} />
        </Field>
        <CoverField
          label="Cover image"
          url={values.cover_url}
          alt=""
          withAlt={false}
          onChange={({ url }) => set({ cover_url: url })}
          urlError={errors.cover_url}
          helper="Optional. The site can also use the first item."
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
