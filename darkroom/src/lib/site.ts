export function siteUrl(fromSettings?: string | null): string {
  const raw = fromSettings || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** One label per destination, used by the header, the home map and the footer. */
export const NAV = [
  { href: "/projects", label: "Work" },
  { href: "/blog", label: "Writing" },
  { href: "/courses", label: "Courses" },
  { href: "/stories", label: "Stories" },
  { href: "/research", label: "Research" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
] as const;

/** The single contact intent on the site. Same words everywhere. */
export const CONTACT_LABEL = "Get in touch";
