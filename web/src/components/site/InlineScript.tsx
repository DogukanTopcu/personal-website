/**
 * A script that runs while the HTML is parsed, before first paint.
 * The type flips on the client so React does not warn about rendering scripts.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
