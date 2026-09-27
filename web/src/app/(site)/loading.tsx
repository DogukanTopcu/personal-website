/**
 * Drafted, not grey. The skeleton is the outline of what is coming, in blue
 * pencil, which is what this site's "not inked yet" looks like everywhere else.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="wrap">
          <div className="skeleton" style={{ height: "3rem", maxWidth: "22rem" }} />
          <div className="skeleton" style={{ height: "1.25rem", maxWidth: "36rem", marginTop: "1.25rem" }} />
        </div>
      </div>
      <div className="wrap section">
        <ul className="index" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <div className="entry">
                <div className="skeleton" style={{ height: "0.85rem", maxWidth: "6rem" }} />
                <div>
                  <div className="skeleton" style={{ height: "1.6rem", maxWidth: "28rem" }} />
                  <div className="skeleton" style={{ height: "0.9rem", maxWidth: "40rem", marginTop: "0.75rem" }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
