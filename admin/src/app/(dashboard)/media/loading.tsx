import { GridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-7 w-32" />
      <Skeleton className="mb-5 h-32 w-full" />
      <Skeleton className="mb-5 h-9 w-72" />
      <GridSkeleton />
    </div>
  );
}
