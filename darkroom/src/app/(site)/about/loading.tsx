import { FrameSkeleton, HeadSkeleton, Loading, ProseSkeleton } from "@/components/site/Skeletons";

/** The about page is coming: the portrait, and the long version beside it. */
export default function LoadingAbout() {
  return (
    <Loading>
      <HeadSkeleton />
      <div className="wrap about">
        <div className="about__portrait">
          <FrameSkeleton style={{ aspectRatio: "4 / 5" }} />
        </div>
        <div className="about__text">
          <ProseSkeleton paragraphs={3} />
        </div>
      </div>
    </Loading>
  );
}
