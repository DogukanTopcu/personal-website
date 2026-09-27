import { FrameSkeleton, HeadSkeleton, Loading } from "@/components/site/Skeletons";

/** Work is coming: the wide gate with its caption, then two stills. */
export default function LoadingWork() {
  return (
    <Loading>
      <HeadSkeleton meta />
      <div className="wrap section">
        <div className="lead-plate">
          <div className="lead-plate__gate">
            <FrameSkeleton className="gate" />
          </div>
          <div className="lead-plate__caption skel__stack">
            <div className="skeleton" style={{ height: "0.7rem", maxWidth: "12rem" }} />
            <div className="skeleton" style={{ height: "2.6rem", maxWidth: "18rem" }} />
            <div className="skeleton" style={{ height: "0.95rem", maxWidth: "24rem" }} />
            <div className="skeleton" style={{ height: "0.95rem", maxWidth: "20rem" }} />
          </div>
        </div>
        <ul className="plate-grid">
          {[0, 1].map((i) => (
            <li key={i}>
              <div className="plate">
                <FrameSkeleton style={{ aspectRatio: "3 / 2" }} />
                <div className="skel__stack">
                  <div className="skeleton" style={{ height: "0.7rem", maxWidth: "10rem" }} />
                  <div className="skeleton" style={{ height: "1.8rem", maxWidth: "16rem" }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Loading>
  );
}
