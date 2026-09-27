import { HeadSkeleton, Loading, ProseSkeleton } from "@/components/site/Skeletons";

/** A course or one of its lessons is coming: the head, then the reading column. */
export default function LoadingCourse() {
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
