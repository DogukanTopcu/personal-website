"use client";

import { Check, FileAudio, FilePdf, FileText, FileVideo } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { kindOfMime, type MediaAsset, type MediaKind } from "@/lib/data/media";
import { formatBytes } from "@/lib/format";

export function fileName(asset: Pick<MediaAsset, "path">): string {
  return asset.path.split("/").pop() ?? asset.path;
}

const KIND_ICON: Record<Exclude<MediaKind, "image">, typeof FileText> = {
  video: FileVideo,
  audio: FileAudio,
  pdf: FilePdf,
  other: FileText,
};

/** A square preview: the image itself, or an icon for other kinds. */
export function MediaThumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  const kind = kindOfMime(asset.mime_type);
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- library thumbnails come from Supabase Storage, which serves them as-is
      <img
        src={asset.url}
        alt={asset.alt}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full bg-surface object-cover", className)}
      />
    );
  }
  const Icon = KIND_ICON[kind];
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-surface text-ink-soft", className)}>
      <Icon size={28} aria-hidden="true" />
      <span className="font-mono text-[0.625rem] uppercase">{kind === "other" ? asset.mime_type.split("/").pop() : kind}</span>
    </div>
  );
}

type MediaTileProps = {
  asset: MediaAsset;
  selected?: boolean;
  onToggle?: () => void;
  /** Buttons shown in the tile's footer (library mode). */
  actions?: ReactNode;
};

export function MediaTile({ asset, selected, onToggle, actions }: MediaTileProps) {
  const name = fileName(asset);
  const size = asset.width && asset.height ? `${asset.width} x ${asset.height}` : formatBytes(asset.size_bytes);

  const preview = (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-hairline-strong">
      <MediaThumb asset={asset} />
      {selected ? (
        <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-paper" aria-hidden="true">
          <Check size={12} weight="bold" />
        </span>
      ) : null}
    </div>
  );

  return (
    <div className={cn("group flex flex-col gap-1.5", selected && "text-accent")}>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={`${selected ? "Deselect" : "Select"} ${name}`}
          className={cn("text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", selected && "[&>div]:border-accent [&>div]:border-2")}
        >
          {preview}
        </button>
      ) : (
        preview
      )}
      <div className="min-w-0">
        <p className="truncate font-mono text-[0.6875rem]" title={asset.path}>
          {name}
        </p>
        <p className="truncate font-mono text-[0.625rem] text-ink-soft">
          {size}
          {asset.alt ? "" : " · no alt"}
        </p>
      </div>
      {actions ? <div className="flex items-center gap-0.5">{actions}</div> : null}
    </div>
  );
}
