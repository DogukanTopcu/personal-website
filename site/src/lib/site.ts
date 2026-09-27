export function siteUrl(fromSettings?: string | null): string {
  const raw = fromSettings || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Every section of the site, in the order the footer and the phone menu list them. */
export const SECTIONS = [
  { href: "/blog", label: "Writing" },
  { href: "/courses", label: "Courses" },
  { href: "/projects", label: "Projects" },
  { href: "/stories", label: "Stories" },
  { href: "/research", label: "Research" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
] as const;

/** The header shows the five most visited; the rest are on the home page and in the footer. */
export const NAV = SECTIONS.filter((s) => ["/blog", "/courses", "/projects", "/gallery", "/about"].includes(s.href));

/** The single contact intent on the site. Same words everywhere. */
export const CONTACT_LABEL = "Get in touch";
