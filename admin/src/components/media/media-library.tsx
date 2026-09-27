"use client";

import { Copy, Code, PencilSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GridSkeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { updateMediaAlt, type MediaAsset } from "@/lib/data/media";
import { deleteAsset, markdownFor } from "@/lib/media/upload";
import { getBrowserClient } from "@/lib/supabase/client";
import { MediaFilters } from "./media-filters";
import { fileName, MediaTile } from "./media-tile";
import { UploadZone } from "./upload-zone";
import { useMediaLibrary } from "./use-media-library";
import { useUploader } from "./use-uploader";

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  } catch {
    toast.error(`Could not copy the ${what.toLowerCase()}.`);
  }
}

/** The /media page: upload, search, edit alt, copy, delete. */
export function MediaLibrary() {
  const library = useMediaLibrary();
  const { state } = library;
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState<MediaAsset | null>(null);
  const [pending, setPending] = useState(false);

  const uploader = useUploader({ onUploaded: library.prepend });

  async function saveAlt(asset: MediaAsset, alt: string) {
    setPending(true);
    const { data, error } = await updateMediaAlt(getBrowserClient(), asset.id, alt.trim());
    setPending(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not save the alt text.");
      return;
    }
    library.replace(data);
    setEditing(null);
    toast.success("Alt text saved.");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    try {
      await deleteAsset(deleting);
      library.remove(deleting.id);
      toast.success(`Deleted ${fileName(deleting)}.`);
      setDeleting(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete the file.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <UploadZone
        items={uploader.items}
        onFiles={uploader.addFiles}
        onDismiss={uploader.dismiss}
        onClearFinished={uploader.clearFinished}
        hint="Drop images, video, audio or PDFs here, or"
      />

      <MediaFilters
        query={state.query}
        kind={state.kind}
        allowed={state.allowed}
        onQuery={library.setQuery}
        onKind={library.setKind}
        total={state.total}
      />

      {state.error ? <p className="text-[0.8125rem] text-error">{state.error}</p> : null}

      {state.loading ? (
        <GridSkeleton />
      ) : state.assets.length === 0 ? (
        <EmptyState>{state.query || state.kind !== "all" ? "No files match these filters." : "The library is empty. Uploaded files will be listed here."}</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {state.assets.map((asset) => (
            <MediaTile
              key={asset.id}
              asset={asset}
              actions={
                <>
                  <Tooltip label="Edit alt text">
                    <Button variant="ghost" size="sm" icon aria-label="Edit alt text" onClick={() => setEditing(asset)}>
                      <PencilSimple size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Copy URL">
                    <Button variant="ghost" size="sm" icon aria-label="Copy URL" onClick={() => copyText(asset.url, "URL")}>
                      <Copy size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Copy markdown">
                    <Button variant="ghost" size="sm" icon aria-label="Copy markdown" onClick={() => copyText(markdownFor(asset), "Markdown")}>
                      <Code size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <Button variant="ghost" size="sm" icon aria-label="Delete" className="ml-auto" onClick={() => setDeleting(asset)}>
                      <Trash size={14} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                </>
              }
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

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !pending && setEditing(null)}>
        {editing ? <AltDialog asset={editing} pending={pending} onSave={saveAlt} onCancel={() => setEditing(null)} /> : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete ${fileName(deleting)}?` : "Delete file?"}
        description="The file is removed from storage. Pages that embed it will show a broken link until they are edited."
        confirmLabel="Delete file"
        destructive
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function AltDialog({
  asset,
  pending,
  onSave,
  onCancel,
}: {
  asset: MediaAsset;
  pending: boolean;
  onSave: (asset: MediaAsset, alt: string) => void;
  onCancel: () => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  return (
    <DialogContent
      title="Alt text"
      description={fileName(asset)}
      size="sm"
      footer={
        <>
          <Button onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" disabled={pending} onClick={() => onSave(asset, alt)}>
            {pending ? "Saving" : "Save"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(asset, alt);
        }}
      >
        <Field label="Alt text" helper="What the file shows, for people who cannot see it. Used as the default when the file is inserted.">
          <Input value={alt} onChange={(event) => setAlt(event.target.value)} autoFocus />
        </Field>
      </form>
    </DialogContent>
  );
}
