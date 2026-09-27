"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { MediaAsset } from "@/lib/data/media";
import { uploadFile, UploadError, validateFile } from "@/lib/media/upload";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const CONCURRENCY = 3;

type UploaderOptions = {
  accept?: string;
  onUploaded: (asset: MediaAsset, file: File) => void;
};

/**
 * The queue lives outside React: it mutates its own list and notifies
 * subscribers, and the hook reads it with useSyncExternalStore.
 */
function createUploadQueue() {
  let items: UploadItem[] = [];
  let options: UploaderOptions = { onUploaded: () => {} };
  let active = 0;
  const waiting: Array<{ id: string; file: File }> = [];
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const patch = (id: string, changes: Partial<UploadItem>) => {
    items = items.map((item) => (item.id === id ? { ...item, ...changes } : item));
    emit();
  };

  const pump = () => {
    while (active < CONCURRENCY && waiting.length > 0) {
      const next = waiting.shift()!;
      active += 1;
      patch(next.id, { status: "uploading" });

      uploadFile(next.file, { onProgress: (fraction) => patch(next.id, { progress: fraction }) }, options.accept)
        .then((asset) => {
          patch(next.id, { status: "done", progress: 1 });
          options.onUploaded(asset, next.file);
        })
        .catch((cause: unknown) => {
          patch(next.id, { status: "error", error: cause instanceof UploadError ? cause.message : "Upload failed." });
        })
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => items,
    setOptions(next: UploaderOptions) {
      options = next;
    },
    addFiles(files: Iterable<File>) {
      const additions: UploadItem[] = [];
      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const problem = validateFile(file, options.accept);
        if (problem) {
          additions.push({ id, name: file.name, size: file.size, progress: 0, status: "error", error: problem });
          continue;
        }
        additions.push({ id, name: file.name, size: file.size, progress: 0, status: "queued" });
        waiting.push({ id, file });
      }
      if (additions.length > 0) {
        items = [...additions, ...items];
        emit();
      }
      pump();
    },
    dismiss(id: string) {
      items = items.filter((item) => item.id !== id);
      emit();
    },
    clearFinished() {
      items = items.filter((item) => item.status === "queued" || item.status === "uploading");
      emit();
    },
  };
}

const EMPTY: UploadItem[] = [];

/** A small upload queue with per-file progress. Three files travel at a time. */
export function useUploader({ accept, onUploaded }: UploaderOptions) {
  const [queue] = useState(createUploadQueue);
  const items = useSyncExternalStore(queue.subscribe, queue.getSnapshot, () => EMPTY);

  useEffect(() => {
    queue.setOptions({ accept, onUploaded });
  }, [queue, accept, onUploaded]);

  const busy = items.some((item) => item.status === "queued" || item.status === "uploading");

  return { items, addFiles: queue.addFiles, dismiss: queue.dismiss, clearFinished: queue.clearFinished, busy };
}
