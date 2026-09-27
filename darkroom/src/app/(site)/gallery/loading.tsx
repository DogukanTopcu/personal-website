import { FrameSkeleton, HeadSkeleton, Loading } from "@/components/site/Skeletons";

/** The gallery is coming: lengths of unexposed film. */
export default function LoadingGallery() {
  return (
    <Loading>
      <HeadSkeleton />
      <div className="wrap section rolls">
        {[0, 1].map((row) => (
          <div key={row} className="roll">
            <div className="skeleton" style={{ height: "2.4rem", maxWidth: "14rem" }} />
            <ol className="roll__film" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="strip strip-cell">
                  <FrameSkeleton className="strip-cell__frame" />
                  <span className="edge-print strip-cell__edge" />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Loading>
  );
}
