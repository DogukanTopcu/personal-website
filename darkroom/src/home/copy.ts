import type { Experience, Settings } from "@/lib/data/types";

/**
 * Copy for the screening. The admin panel's "Home page copy" fields use the
 * same keys as the first site's waypoints, so one set of overrides serves both:
 * title -> the opening, profile -> the credits, work -> the work, writing ->
 * the programme, gallery -> the darkroom, sheet -> the contact sheet.
 */
export interface Credit {
  role: string;
  name: string;
  note?: string;
}

export interface ScreeningCopy {
  title: { heading: string; body: string };
  credits: Credit[];
  creditsClose: { heading: string; body: string };
  work: { heading: string; body: string };
  writing: { heading: string; body: string };
  gallery: { heading: string; body: string };
  sheet: { heading: string; body: string };
}

const pick = (settings: Settings, key: string, fallback: { heading: string; body: string }) => {
  const override = settings.home_copy?.[key];
  return { heading: override?.heading ?? fallback.heading, body: override?.body ?? fallback.body };
};

/** One credit per role, in the order a film would bill them: now, then before. */
function creditsFrom(experiences: Experience[]): Credit[] {
  const order = ["work", "venture", "leadership", "education", "award"];
  const sorted = [...experiences].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.position - b.position);
  return sorted.slice(0, 4).map((e) => {
    // A credit bills a short name. "Software Society, İzmir Institute of
    // Technology" becomes the name and, beneath it, where it was.
    const [short, ...rest] = e.organization.split(",").map((part) => part.trim());
    const where = rest.join(", ");
    const note = where || e.summary || undefined;
    if (e.kind === "education") {
      const year = e.end_date ? new Date(e.end_date).getUTCFullYear() : null;
      return { role: year ? `${e.title}, ${year}` : e.title, name: short || e.organization, note: e.summary || where || undefined };
    }
    return { role: e.title, name: short || e.organization, note };
  });
}

export function buildScreeningCopy(settings: Settings, experiences: Experience[]): ScreeningCopy {
  const credits = creditsFrom(experiences);
  return {
    title: pick(settings, "title", {
      heading: settings.full_name || "Doğukan Topçu",
      body: settings.headline || "Software engineer who also draws.",
    }),
    credits: credits.length
      ? credits
      : [{ role: "Software engineer", name: settings.full_name || "Doğukan Topçu" }],
    creditsClose: pick(settings, "profile", {
      heading: "Seven years of building things",
      body: "Web, games, desktop and mobile, and now small language models.",
    }),
    work: pick(settings, "work", {
      heading: "Things I built",
      body: "Software, games, robotics and machine learning. Each one taught me how something holds together.",
    }),
    writing: pick(settings, "writing", {
      heading: "I write to learn it twice",
      body: "Courses on computer engineering, essays and reviews, and fiction in chapters.",
    }),
    gallery: pick(settings, "gallery", {
      heading: "The other half",
      body: "Charcoal, photographs, interfaces and things made out of data.",
    }),
    sheet: pick(settings, "sheet", {
      heading: "The whole reel, on one sheet",
      body: "Every part of the site, printed as a contact sheet. One frame is marked.",
    }),
  };
}
