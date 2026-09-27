"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/input";
import { CONTENT_STATUSES, LABELS } from "@/lib/types";

type ListToolbarProps = {
  q: string;
  status: string;
  category?: string;
  categories?: Array<{ id: string; name: string }>;
  total: number;
  noun: string;
};

/** Search, status and category filters kept in the URL so lists are shareable and reload-safe. */
export function ListToolbar({ q, status, category, categories, total, noun }: ListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);

  function apply(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  }

  useEffect(() => {
    if (text === q) return;
    const timer = setTimeout(() => apply({ q: text.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `apply` reads the latest router state when it runs
  }, [text]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" data-pending={pending ? "true" : undefined}>
      <div className="relative min-w-0 flex-1 basis-60">
        <MagnifyingGlass size={14} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-soft" />
        <Input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search by title"
          aria-label="Search by title"
          className="pl-8"
        />
      </div>
      <Select value={status} onChange={(event) => apply({ status: event.target.value })} aria-label="Status" className="w-36">
        <option value="all">All statuses</option>
        {CONTENT_STATUSES.map((entry) => (
          <option key={entry} value={entry}>
            {LABELS.status[entry]}
          </option>
        ))}
      </Select>
      {categories ? (
        <Select value={category ?? ""} onChange={(event) => apply({ category: event.target.value })} aria-label="Category" className="w-44">
          <option value="">All categories</option>
          <option value="none">Uncategorised</option>
          {categories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </Select>
      ) : null}
      <span className="font-mono text-[0.6875rem] text-ink-soft" aria-live="polite">
        {pending ? "Loading" : `${total} ${total === 1 ? noun : `${noun}s`}`}
      </span>
    </div>
  );
}
