"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input, Select } from "@/components/ui/input";
import { MEDIA_KIND_LABELS, MEDIA_KINDS, type MediaKind } from "@/lib/data/media";

type MediaFiltersProps = {
  query: string;
  kind: MediaKind | "all";
  allowed: MediaKind[];
  onQuery: (value: string) => void;
  onKind: (value: MediaKind | "all") => void;
  total: number;
};

export function MediaFilters({ query, kind, allowed, onQuery, onKind, total }: MediaFiltersProps) {
  const kinds = allowed.length > 0 ? MEDIA_KINDS.filter((entry) => allowed.includes(entry)) : MEDIA_KINDS;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-56">
        <MagnifyingGlass size={14} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-soft" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search by file name or alt text"
          aria-label="Search media"
          className="pl-8"
        />
      </div>
      {kinds.length > 1 ? (
        <Select value={kind} onChange={(event) => onKind(event.target.value as MediaKind | "all")} aria-label="Type" className="w-36">
          <option value="all">All types</option>
          {kinds.map((entry) => (
            <option key={entry} value={entry}>
              {MEDIA_KIND_LABELS[entry]}
            </option>
          ))}
        </Select>
      ) : null}
      <span className="font-mono text-[0.6875rem] text-ink-soft">
        {total} file{total === 1 ? "" : "s"}
      </span>
    </div>
  );
}
