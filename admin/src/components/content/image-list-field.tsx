"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { GalleryImage } from "@/lib/types";
import { SortableList } from "./sortable-list";

type ImageListFieldProps = {
  label: string;
  helper?: string;
  value: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
  /** Errors keyed like "gallery.2.alt". */
  errorFor: (key: string) => string | null;
  fieldKey: string;
};

type Entry = GalleryImage & { key: string };

/** An ordered list of images with alt and caption, filled from the media library. */
export function ImageListField({ label, helper, value, onChange, errorFor, fieldKey }: ImageListFieldProps) {
  const [open, setOpen] = useState(false);
  // Stable keys survive reordering; the URL alone can repeat.
  const [keys, setKeys] = useState<string[]>(() => value.map((_, index) => `k${index}`));

  const entries: Entry[] = value.map((image, index) => ({ ...image, key: keys[index] ?? `k${index}` }));

  function commit(next: Entry[]) {
    setKeys(next.map((entry) => entry.key));
    onChange(next.map(({ key: _key, ...image }) => image));
  }

  function patch(index: number, changes: Partial<GalleryImage>) {
    commit(entries.map((entry, i) => (i === index ? { ...entry, ...changes } : entry)));
  }

  return (
    <div className="flex flex-col gap-3" data-field={fieldKey}>
      <Field label={label} as="group" helper={helper} error={errorFor(fieldKey)}>
        <div className="flex flex-col gap-3">
          {entries.length > 0 ? (
            <SortableList
              items={entries}
              getId={(entry) => entry.key}
              onReorder={commit}
              className="flex flex-col gap-2"
              renderItem={(entry, handle, index) => (
                <div className="flex gap-3 rounded-lg border border-hairline-strong bg-elevated p-2">
                  <button {...handle} />
                  <div className="h-20 w-28 shrink-0 overflow-hidden border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element -- media bucket image */}
                    <img src={entry.url} alt={entry.alt} className="h-full w-full object-cover" />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <div data-field={`${fieldKey}.${index}.alt`}>
                      <Field label="Alt text" required error={errorFor(`${fieldKey}.${index}.alt`)}>
                        <Input value={entry.alt} onChange={(event) => patch(index, { alt: event.target.value })} />
                      </Field>
                    </div>
                    <Field label="Caption" error={errorFor(`${fieldKey}.${index}.caption`)}>
                      <Input value={entry.caption} onChange={(event) => patch(index, { caption: event.target.value })} />
                    </Field>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon
                    aria-label="Remove image"
                    onClick={() => commit(entries.filter((_, i) => i !== index))}
                  >
                    <X size={14} aria-hidden="true" />
                  </Button>
                </div>
              )}
            />
          ) : null}
          <div>
            <Button size="sm" onClick={() => setOpen(true)}>
              Add images
            </Button>
          </div>
        </div>
      </Field>

      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        mode="multiple"
        accept="image/*"
        title="Add images"
        onPick={(picks) => {
          const additions: Entry[] = picks.map((pick, index) => ({
            key: `k${Date.now()}-${index}`,
            url: pick.asset.url,
            alt: pick.alt || pick.asset.alt,
            caption: pick.caption,
          }));
          commit([...entries, ...additions]);
        }}
      />
    </div>
  );
}
