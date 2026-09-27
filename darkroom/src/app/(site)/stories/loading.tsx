import { FrameSkeleton, HeadSkeleton, Loading } from "@/components/site/Skeletons";

/** A story is coming: its poster, and the chapters beside it. */
export default function LoadingStories() {
  return (
    <Loading>
      <HeadSkeleton />
      <div className="wrap section">
        <div className="story story--skeleton">
          <div className="story__poster">
            <FrameSkeleton style={{ aspectRatio: "2 / 3" }} />
          </div>
          <div className="story__head skel__stack">
            <div className="skeleton" style={{ height: "2.4rem", maxWidth: "20rem" }} />
            <div className="skeleton" style={{ height: "0.7rem", maxWidth: "16rem" }} />
          </div>
          <div className="story__synopsis skel__stack">
            <div className="skeleton" style={{ height: "0.95rem", maxWidth: "40rem" }} />
            <div className="skeleton" style={{ height: "0.95rem", maxWidth: "34rem" }} />
          </div>
          <div className="story__contents skel__stack">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: "1rem", maxWidth: "26rem" }} />
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}
