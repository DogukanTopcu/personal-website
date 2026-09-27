import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { SearchParams } from "@/lib/data/shared";

type PaginationProps = {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: SearchParams;
};

function hrefFor(basePath: string, searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single && key !== "page") params.set(key, single);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, pageCount, basePath, searchParams }: PaginationProps) {
  if (pageCount <= 1) return null;
  const disabled = "pointer-events-none opacity-40";
  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pages">
      <Link
        href={hrefFor(basePath, searchParams, page - 1)}
        className={cn(buttonClass({ size: "sm" }), page <= 1 && disabled)}
        aria-disabled={page <= 1}
      >
        Previous
      </Link>
      <span className="font-mono text-[0.6875rem] text-ink-soft">
        Page {page} of {pageCount}
      </span>
      <Link
        href={hrefFor(basePath, searchParams, page + 1)}
        className={cn(buttonClass({ size: "sm" }), page >= pageCount && disabled)}
        aria-disabled={page >= pageCount}
      >
        Next
      </Link>
    </nav>
  );
}
