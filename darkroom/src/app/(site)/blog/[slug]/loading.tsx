import { HeadSkeleton, Loading, ProseSkeleton } from "@/components/site/Skeletons";

/** An essay or a review is coming: the head, then the reading column. */
export default function LoadingPost() {
  return (
    <Loading>
      <HeadSkeleton crumbs meta />
      <div className="wrap">
        <div className="reading">
          <ProseSkeleton paragraphs={4} />
        </div>
      </div>
    </Loading>
  );
}
