"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GridSkeleton } from "@/components/ui/skeleton";
import type { MediaAsset } from "@/lib/data/media";
import { MediaFilters } from "./media-filters";
import { MediaTile } from "./media-tile";
import { UploadZone } from "./upload-zone";
import { useMediaLibrary } from "./use-media-library";
import { useUploader } from "./use-uploader";

export type MediaPick = { asset: MediaAsset; alt: string; caption: string };

type MediaPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "single" | "multiple";
  /** Same syntax as the file input `accept` attribute. */
  accept?: string;
  /** Ask for alt text and a caption when one file is picked (markdown inserts). */
  describe?: boolean;
  title?: string;
  onPick: (picks: MediaPick[]) => void;
};

/** Choose from the library or upload, then confirm. Shared by every image field. */
export function MediaPicker({
  open,
  onOpenChange,
  mode = "single",
  accept,
  describe = false,
  title = mode === "single" ? "Choose a file" : "Choose files",
  onPick,
}: MediaPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <PickerBody mode={mode} accept={accept} describe={describe} title={title} onPick={onPick} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

type BodyProps = Required<Pick<MediaPickerProps, "mode" | "describe" | "title" | "onPick" | "onOpenChange">> &
  Pick<MediaPickerProps, "accept">;

function PickerBody({ mode, accept, describe, title, onPick, onOpenChange }: BodyProps) {
  const library = useMediaLibrary(accept);
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const uploader = useUploader({
    accept,
    onUploaded: (asset) => {
      library.prepend(asset);
      toggle(asset, true);
    },
  });

  function toggle(asset: MediaAsset, forceOn = false) {
    setSelected((current) => {
      const isSelected = current.some((entry) => entry.id === asset.id);
      if (isSelected && !forceOn) return current.filter((entry) => entry.id !== asset.id);
      if (isSelected) return current;
      const next = mode === "single" ? [asset] : [...current, asset];
      if (next.length === 1) setAlt(next[0].alt);
      return next;
    });
  }

  function confirm() {
    const picks = selected.map((asset, index) => ({
      asset,
      alt: selected.length === 1 && describe ? alt.trim() : asset.alt,
      caption: selected.length === 1 && describe && index === 0 ? caption.trim() : "",
    }));
    onPick(picks);
    onOpenChange(false);
  }

  const { state } = library;
  const single = selected.length === 1 ? selected[0] : null;

  return (
    <DialogContent
      title={title}
      size="xl"
      className="h-[calc(100dvh-2rem)] max-h-[52rem]"
      footer={
        <>
          <span className="mr-auto font-mono text-[0.6875rem] text-ink-soft">
            {selected.length === 0 ? "Nothing selected" : `${selected.length} selected`}
          </span>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={selected.length === 0} onClick={confirm}>
            {mode === "single" ? "Use this file" : `Use ${selected.length || ""} file${selected.length === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <MediaFilters
              query={state.query}
              kind={state.kind}
              allowed={state.allowed}
              onQuery={library.setQuery}
              onKind={library.setKind}
              total={state.total}
            />
          </div>
          <Button size="sm" onClick={() => setShowUpload((value) => !value)} aria-expanded={showUpload}>
            {showUpload ? "Hide upload" : "Upload"}
          </Button>
        </div>

        {showUpload || uploader.items.length > 0 ? (
          <UploadZone
            accept={accept}
            multiple={mode === "multiple"}
            items={uploader.items}
            onFiles={uploader.addFiles}
            onDismiss={uploader.dismiss}
            onClearFinished={uploader.clearFinished}
            compact
          />
        ) : null}

        {state.error ? <p className="text-[0.8125rem] text-error">{state.error}</p> : null}

        {state.loading ? (
          <GridSkeleton />
        ) : state.assets.length === 0 ? (
          <EmptyState action={<Button size="sm" onClick={() => setShowUpload(true)}>Upload a file</Button>}>
            {state.query ? "No files match this search." : "The library is empty. Uploads will show up here."}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {state.assets.map((asset) => (
              <MediaTile
                key={asset.id}
                asset={asset}
                selected={selected.some((entry) => entry.id === asset.id)}
                onToggle={() => toggle(asset)}
              />
            ))}
          </div>
        )}

        {state.hasMore ? (
          <div className="flex justify-center">
            <Button size="sm" onClick={library.loadMore} disabled={state.loadingMore}>
              {state.loadingMore ? "Loading" : "Load more"}
            </Button>
          </div>
        ) : null}

        {describe && single ? (
          <div className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
            <Field label="Alt text" helper="Read aloud instead of the file. Leave empty only for decorative images.">
              <Input value={alt} onChange={(event) => setAlt(event.target.value)} />
            </Field>
            <Field label="Caption" helper="Optional. Shown under the media.">
              <Input value={caption} onChange={(event) => setCaption(event.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>
    </DialogContent>
  );
}
