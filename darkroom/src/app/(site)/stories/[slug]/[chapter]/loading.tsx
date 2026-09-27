import { HeadSkeleton, Loading, ProseSkeleton } from "@/components/site/Skeletons";

/** A chapter is coming: a centred head and the fiction measure, nothing else. */
export default function LoadingChapter() {
  return (
    <Loading>
      <HeadSkeleton crumbs meta center />
      <div className="wrap chapter">
        <div className="chapter__column">
          <ProseSkeleton paragraphs={4} />
        </div>
      </div>
    </Loading>
  );
}
