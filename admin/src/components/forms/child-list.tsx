"use client";

import { Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableList } from "@/components/content/sortable-list";
import { Button, LinkButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusMark } from "@/components/ui/status-mark";
import { Tooltip } from "@/components/ui/tooltip";
import type { ActionResult } from "@/lib/action-result";
import type { ContentStatus } from "@/lib/types";

export type ChildRow = {
  id: string;
  title: string;
  slug: string;
  /** Section title for lessons, part title for chapters. */
  group: string;
  status: ContentStatus;
  published_at: string | null;
  reading_minutes: number;
};

type ChildListProps = {
  title: string;
  noun: string;
  rows: ChildRow[];
  newHref: string;
  editHref: (id: string) => string;
  onReorder: (ids: string[]) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  emptyText: string;
};

/** Lessons of a course, chapters of a story: drag to reorder, add, delete. */
export function ChildList({ title, noun, rows, newHref, editHref, onReorder, onDelete, emptyText }: ChildListProps) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [deleting, setDeleting] = useState<ChildRow | null>(null);
  const [pending, startTransition] = useTransition();

  function reorder(next: ChildRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await onReorder(next.map((row) => row.id));
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
      const result = await onDelete(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((row) => row.id !== target.id));
      setDeleting(null);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${target.title}".`);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="eyebrow">
          {title} ({items.length})
        </h2>
        <LinkButton href={newHref} size="sm">
          Add {noun}
        </LinkButton>
      </div>

      {items.length === 0 ? (
        <EmptyState className="py-8" action={<LinkButton href={newHref} size="sm">Add the first {noun}</LinkButton>}>
          {emptyText}
        </EmptyState>
      ) : (
        <SortableList
          items={items}
          getId={(row) => row.id}
          onReorder={reorder}
          disabled={pending}
          className="border-y border-hairline-strong"
          itemClassName="border-b border-hairline last:border-b-0 bg-paper"
          renderItem={(row, handle, index) => (
            <div className="flex items-center gap-2 py-1.5 pr-1">
              <button {...handle} />
              <span className="w-6 shrink-0 text-right font-mono text-[0.6875rem] text-ink-soft">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={editHref(row.id)} className="block truncate text-[0.8125rem] font-medium hover:underline">
                  {row.title || "Untitled"}
                </Link>
                <span className="block truncate font-mono text-[0.6875rem] text-ink-soft">
                  {row.group ? `${row.group} · ` : ""}
                  {row.slug} · {row.reading_minutes} min
                </span>
              </div>
              <StatusMark status={row.status} publishedAt={row.published_at} className="hidden sm:inline-flex" />
              <Tooltip label={`Delete ${noun}`}>
                <Button variant="ghost" size="sm" icon aria-label={`Delete ${row.title}`} onClick={() => setDeleting(row)}>
                  <Trash size={14} aria-hidden="true" />
                </Button>
              </Tooltip>
            </div>
          )}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.title}"?` : `Delete ${noun}?`}
        description={`This ${noun} and its text are removed for good.`}
        confirmLabel={`Delete ${noun}`}
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </section>
  );
}
