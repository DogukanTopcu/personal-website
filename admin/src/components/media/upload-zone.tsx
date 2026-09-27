"use client";

import { UploadSimple, X } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import type { UploadItem } from "./use-uploader";

type UploadZoneProps = {
  accept?: string;
  multiple?: boolean;
  items: UploadItem[];
  onFiles: (files: File[]) => void;
  onDismiss: (id: string) => void;
  onClearFinished: () => void;
  /** The line inside the frame. */
  hint?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** A drafted drop frame with a file button and the progress of each upload. */
export function UploadZone({
  accept,
  multiple = true,
  items,
  onFiles,
  onDismiss,
  onClearFinished,
  hint,
  compact = false,
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  }

  const finished = items.filter((item) => item.status === "done" || item.status === "error").length;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "dashed-frame flex flex-col items-center justify-center gap-2 text-center text-[0.8125rem] text-ink-soft transition-opacity duration-150",
          compact ? "px-4 py-4" : "px-6 py-8",
          over && "bg-surface",
        )}
      >
        <UploadSimple size={compact ? 18 : 22} aria-hidden="true" className="text-accent" />
        <p>{hint ?? (multiple ? "Drop files here, or" : "Drop a file here, or")}</p>
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          Choose {multiple ? "files" : "a file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onFiles(files);
            event.target.value = "";
          }}
        />
        <p className="font-mono text-[0.6875rem]">Up to 50 MB per file</p>
      </div>

      {items.length > 0 ? (
        <ul className="border-y border-hairline-strong" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-b border-hairline px-2 py-1.5 text-xs last:border-b-0">
              <span className="min-w-0 flex-1 truncate font-mono" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-ink-soft">{formatBytes(item.size)}</span>
              {item.status === "error" ? (
                <span className="max-w-[50%] text-error">{item.error}</span>
              ) : item.status === "done" ? (
                <span className="text-success">Uploaded</span>
              ) : (
                <span className="flex w-32 items-center gap-2">
                  <span className="relative h-1 flex-1 border border-hairline-strong" role="progressbar" aria-valuenow={Math.round(item.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${item.name}`}>
                    <span
                      className="absolute inset-0 origin-left bg-ink transition-transform duration-150"
                      style={{ transform: `scaleX(${item.status === "queued" ? 0 : item.progress})` }}
                    />
                  </span>
                  <span className="w-8 text-right font-mono text-ink-soft">
                    {item.status === "queued" ? "wait" : `${Math.round(item.progress * 100)}%`}
                  </span>
                </span>
              )}
              {item.status === "done" || item.status === "error" ? (
                <button
                  type="button"
                  className="text-ink-soft hover:text-ink"
                  aria-label={`Dismiss ${item.name}`}
                  onClick={() => onDismiss(item.id)}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
          {finished > 1 ? (
            <li className="flex justify-end px-2 py-1">
              <button type="button" className="link text-xs" onClick={onClearFinished}>
                Clear finished
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
