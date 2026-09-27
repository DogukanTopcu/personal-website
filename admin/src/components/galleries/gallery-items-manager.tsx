"use client";

import { PencilSimple, Star, Trash, VideoCamera, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CoverField } from "@/components/content/cover-field";
import { SortableList } from "@/components/content/sortable-list";
import { MediaPicker } from "@/components/media/media-picker";
import { UploadZone } from "@/components/media/upload-zone";
import { useUploader } from "@/components/media/use-uploader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StatusMark } from "@/components/ui/status-mark";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { Tooltip } from "@/components/ui/tooltip";
import type { FieldErrors } from "@/lib/action-result";
import { addGalleryItems, removeGalleryItem, reorderGalleryItems, saveGalleryItem } from "@/lib/actions/galleries";
import type { GalleryItemRow, GalleryRecord } from "@/lib/data/galleries";
import type { MediaAsset } from "@/lib/data/media";
import { toGalleryItemInput } from "@/lib/inputs";
import type { GalleryItemInput, NewGalleryItemInput } from "@/lib/schemas";
import { CONTENT_STATUSES, LABELS } from "@/lib/types";

type Props = { gallery: GalleryRecord; items: GalleryItemRow[] };

const ACCEPT = "image/*,video/*";

function titleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
}

function toNewItem(asset: MediaAsset, title: string): NewGalleryItemInput {
  return {
    media_url: asset.url,
    media_type: asset.mime_type.startsWith("video/") ? "video" : "image",
    title,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
  };
}

export function GalleryItemsManager({ gallery, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<GalleryItemRow | null>(null);
  const [deleting, setDeleting] = useState<GalleryItemRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const batch = useRef<NewGalleryItemInput[]>([]);

  const uploader = useUploader({
    accept: ACCEPT,
    onUploaded: (asset, file) => {
      batch.current.push(toNewItem(asset, titleFromFile(file.name)));
    },
  });

  function add(entries: NewGalleryItemInput[]) {
    if (entries.length === 0) return;
    startTransition(async () => {
      const result = await addGalleryItems(gallery.id, entries);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => [...current, ...result.data]);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Added ${result.data.length} item${result.data.length === 1 ? "" : "s"}.`);
    });
  }

  // Once every queued upload has settled, the successful ones join the gallery together.
  useEffect(() => {
    if (uploader.busy || batch.current.length === 0) return;
    const entries = batch.current;
    batch.current = [];
    add(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the queue drains
  }, [uploader.busy]);

  function reorder(next: GalleryItemRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await reorderGalleryItems(gallery.id, next.map((item) => item.id));
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
      const result = await removeGalleryItem(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== target.id));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success("Item removed.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <UploadZone
        accept={ACCEPT}
        items={uploader.items}
        onFiles={uploader.addFiles}
        onDismiss={uploader.dismiss}
        onClearFinished={uploader.clearFinished}
        hint="Drop images or video here to add them to the gallery, or"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[0.6875rem] text-ink-soft">
          {items.length} item{items.length === 1 ? "" : "s"} · drag to reorder
        </span>
        <Button size="sm" onClick={() => setPickerOpen(true)}>
          Add from library
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState>Uploaded images and video will appear here in the order visitors see them.</EmptyState>
      ) : (
        <SortableList
          items={items}
          getId={(item) => item.id}
          onReorder={reorder}
          disabled={pending}
          layout="grid"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          renderItem={(item, handle) => (
            <div className="flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface">
              <div className="relative aspect-square w-full overflow-hidden bg-elevated">
                {item.media_type === "video" ? (
                  item.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- media bucket image
                    <img src={item.poster_url} alt={item.alt} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-soft">
                      <VideoCamera size={28} aria-hidden="true" />
                    </div>
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- media bucket image
                  <img src={item.media_url} alt={item.alt} loading="lazy" className="h-full w-full object-cover" />
                )}
                <div className="absolute top-1 left-1 bg-elevated/90">
                  <button {...handle} />
                </div>
                {item.featured ? (
                  <span className="absolute top-1.5 right-1.5 bg-elevated/90 p-1 text-accent" aria-label="Featured">
                    <Star size={12} weight="fill" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 px-2 py-1.5">
                <p className="truncate text-xs font-medium" title={item.title}>
                  {item.title || "Untitled"}
                </p>
                <div className="flex items-center justify-between">
                  <StatusMark status={item.status} publishedAt={item.published_at} className="text-[0.6875rem]" />
                  <div className="flex">
                    <Tooltip label="Edit">
                      <Button variant="ghost" size="sm" icon aria-label={`Edit ${item.title || "item"}`} onClick={() => setEditing(item)}>
                        <PencilSimple size={13} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                    <Tooltip label="Remove from gallery">
                      <Button variant="ghost" size="sm" icon aria-label={`Remove ${item.title || "item"}`} onClick={() => setDeleting(item)}>
                        <Trash size={13} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="multiple"
        accept={ACCEPT}
        title="Add from the library"
        onPick={(picks) => add(picks.map((pick) => toNewItem(pick.asset, titleFromFile(pick.asset.path.split("/").pop() ?? ""))))}
      />

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <ItemSheet
            item={editing}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
              setEditing(null);
            }}
          />
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remove "${deleting?.title || "this item"}" from the gallery?`}
        description="The item is removed from the gallery. The file stays in the media library."
        confirmLabel="Remove item"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

function ItemSheet({ item, onClose, onSaved }: { item: GalleryItemRow; onClose: () => void; onSaved: (item: GalleryItemRow) => void }) {
  const [values, setValues] = useState<GalleryItemInput>(() => toGalleryItemInput(item));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<GalleryItemInput>) => setValues((current) => ({ ...current, ...patch }));

  function setMeta(index: number, patch: Partial<{ key: string; value: string }>) {
    set({ meta: values.meta.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)) });
  }

  function submit() {
    startTransition(async () => {
      const result = await saveGalleryItem(item.id, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success("Item saved.");
      onSaved(result.data);
    });
  }

  return (
    <SheetContent
      title="Edit item"
      description={item.media_url.split("/").pop()}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Saving" : "Save"}
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
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-hairline-strong bg-surface">
          {item.media_type === "video" ? (
            <video src={item.media_url} poster={item.poster_url ?? undefined} controls preload="metadata" className="h-full w-full bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- media bucket image
            <img src={item.media_url} alt={values.alt} className="h-full w-full object-contain" />
          )}
        </div>

        <Field label="Title" error={errors.title}>
          <Input value={values.title} onChange={(event) => set({ title: event.target.value })} autoFocus />
        </Field>
        <Field label="Caption" error={errors.caption}>
          <Textarea value={values.caption} onChange={(event) => set({ caption: event.target.value })} rows={2} />
        </Field>
        <Field label="Alt text" helper="What the piece shows, for people who cannot see it." error={errors.alt}>
          <Input value={values.alt} onChange={(event) => set({ alt: event.target.value })} />
        </Field>
        <Field label="Made on" error={errors.made_on}>
          <Input type="date" mono value={values.made_on ?? ""} onChange={(event) => set({ made_on: event.target.value || null })} />
        </Field>

        {item.media_type === "video" ? (
          <CoverField
            label="Poster image"
            url={values.poster_url}
            alt=""
            withAlt={false}
            onChange={({ url }) => set({ poster_url: url })}
            urlError={errors.poster_url}
            helper="Shown before the video plays."
            fieldKeys={{ url: "poster_url", alt: "poster_alt" }}
          />
        ) : null}

        <Field label="Details" as="group" helper="Medium, camera, lens, tools. Free key and value pairs." error={errors.meta}>
          <div className="flex flex-col gap-2">
            {values.meta.map((entry, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2/5">
                  <Input
                    aria-label="Detail name"
                    placeholder="medium"
                    mono
                    value={entry.key}
                    onChange={(event) => setMeta(index, { key: event.target.value })}
                    aria-invalid={errors[`meta.${index}.key`] ? true : undefined}
                  />
                  {errors[`meta.${index}.key`] ? <p className="mt-1 text-xs text-error">{errors[`meta.${index}.key`]}</p> : null}
                </div>
                <Input
                  aria-label="Detail value"
                  placeholder="charcoal on paper"
                  value={entry.value}
                  onChange={(event) => setMeta(index, { value: event.target.value })}
                />
                <Button variant="ghost" icon aria-label="Remove detail" onClick={() => set({ meta: values.meta.filter((_, i) => i !== index) })}>
                  <X size={14} aria-hidden="true" />
                </Button>
              </div>
            ))}
            <div>
              <Button size="sm" onClick={() => set({ meta: [...values.meta, { key: "", value: "" }] })}>
                Add detail
              </Button>
            </div>
          </div>
        </Field>

        <Field label="Tags" helper="Enter or comma adds a tag." error={errors.tags}>
          <TagInput value={values.tags} onChange={(tags) => set({ tags })} placeholder="Add a tag" />
        </Field>

        <Switch checked={values.featured} onCheckedChange={(featured) => set({ featured })} label="Featured" description="Shown first in the gallery row on the home page." />

        <Field label="Status" error={errors.status}>
          <Select value={values.status} onChange={(event) => set({ status: event.target.value as GalleryItemInput["status"] })}>
            {CONTENT_STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {LABELS.status[entry]}
              </option>
            ))}
          </Select>
        </Field>

        {formError ? (
          <p role="alert" className="border-l-2 border-error pl-3 text-xs text-error">
            {formError}
          </p>
        ) : null}
      </form>
    </SheetContent>
  );
}
