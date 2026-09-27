import { FrameSkeleton, HeadSkeleton, Loading, ProseSkeleton } from "@/components/site/Skeletons";

/** A project is coming: the gate, the technical sheet, the write-up. */
export default function LoadingProject() {
  return (
    <Loading>
      <HeadSkeleton crumbs />
      <div className="wrap">
        <div className="detail-gate">
          <FrameSkeleton className="gate" />
        </div>
        <div className="reading">
          <div>
            <div className="facts detail-facts">
              {[0, 1, 2].map((i) => (
                <div key={i} className="facts__row">
                  <div className="skeleton" style={{ height: "0.7rem", maxWidth: "5rem", marginTop: "0.3rem" }} />
                  <div className="skeleton" style={{ height: "0.95rem", maxWidth: "16rem" }} />
                </div>
              ))}
            </div>
            <ProseSkeleton />
          </div>
        </div>
      </div>
    </Loading>
  );
}
