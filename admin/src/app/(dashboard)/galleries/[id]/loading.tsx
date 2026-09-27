import { GridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-7 w-48" />
      <Skeleton className="mb-5 h-32 w-full" />
      <GridSkeleton count={10} />
    </div>
  );
}
