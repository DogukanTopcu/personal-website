import { HeadSkeleton, Loading, RowsSkeleton } from "@/components/site/Skeletons";

/** The programme is coming: a page head and a few listing rows, breathing. */
export default function LoadingPage() {
  return (
    <Loading>
      <HeadSkeleton />
      <div className="wrap section">
        <RowsSkeleton />
      </div>
    </Loading>
  );
}
