/** A quiet outline of the page that is on its way. */
export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="skeleton" style={{ height: "2.5rem", maxWidth: "18rem" }} />
        <div className="skeleton" style={{ height: "1.1rem", maxWidth: "32rem", marginTop: "1rem" }} />
      </div>
      <ul className="rows" style={{ marginTop: "2.5rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <li key={i} style={{ paddingBlock: "1rem" }}>
            <div className="skeleton" style={{ height: "1.1rem", maxWidth: "26rem" }} />
            <div className="skeleton" style={{ height: "0.9rem", maxWidth: "36rem", marginTop: "0.6rem" }} />
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading</span>
    </div>
  );
}
