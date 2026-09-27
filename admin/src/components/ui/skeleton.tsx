import { cn } from "@/lib/cn";

type SkeletonProps = { className?: string };

/** A blue drafted outline of the thing that is loading. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton h-4", className)} aria-hidden="true" />;
}

/** An image slot: the outline plus a diagonal cross. */
export function SkeletonFrame({ className }: SkeletonProps) {
  return (
    <div className={cn("skeleton relative", className)} aria-hidden="true">
      <DiagonalCross />
    </div>
  );
}

export function DiagonalCross({ className }: SkeletonProps) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-accent", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** A table of `rows` drafted rows. */
export function TableSkeleton({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border-y border-hairline-strong" aria-busy="true" aria-label="Loading">
      <div className="flex h-9 items-center gap-6 border-b border-hairline-strong px-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-2.5 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-12 items-center gap-6 border-b border-hairline px-3 last:border-b-0">
          <Skeleton className="h-3 w-[40%]" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

/** The two-column editor layout. */
export function EditorSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy="true" aria-label="Loading">
      <div className="space-y-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <SkeletonFrame className="aspect-[3/2] w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

/** A grid of image frames. */
export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonFrame key={index} className="aspect-square w-full" />
      ))}
    </div>
  );
}
