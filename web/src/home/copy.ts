import type { Settings } from "@/lib/data/types";

export type WaypointKey = "title" | "profile" | "research" | "work" | "writing" | "gallery" | "sheet";

export interface WaypointCopy {
  key: WaypointKey;
  /** short label for the map rail */
  label: string;
  heading: string;
  body: string;
  links: { href: string; label: string }[];
}

/** Counts gathered once on the server, so the page can say what is actually there. */
export interface HomeCounts {
  projects: number;
  posts: number;
  courses: number;
  lessons: number;
  stories: number;
  publications: number;
  galleryItems: number;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function buildCopy(settings: Settings, counts: HomeCounts): WaypointCopy[] {
  const name = settings.full_name || "Doğukan Topçu";
  const first = name.split(" ")[0];

  const base: WaypointCopy[] = [
    {
      key: "title",
      label: "Title",
      heading: name,
      body: settings.headline || "Software engineer who also draws.",
      links: [],
    },
    {
      key: "profile",
      label: "Profile",
      heading: "Seven years of building things",
      body:
        settings.intro ||
        "Backend and AI work at the HubX AI Lab in İzmir, a share in WaterLog, three years leading a university software society, and a computer engineering degree behind all of it.",
      links: [{ href: "/about", label: "Read the long version" }],
    },
    {
      key: "research",
      label: "Research",
      heading: "Small models, stacked differently",
      body:
        "My thesis asked how small language models developed, and which hybrid architectures could bring them closer to large ones. Image understanding and reinforcement learning are next.",
      links: [
        { href: "/research", label: counts.publications ? `Research (${counts.publications})` : "Research" },
      ],
    },
    {
      key: "work",
      label: "Work",
      heading: "Things I built",
      body:
        "Web, games, desktop, mobile, robotics and machine learning. Different shapes, the same habit of taking something apart to see how it holds together.",
      links: [{ href: "/projects", label: counts.projects ? `${plural(counts.projects, "project")}` : "Projects" }],
    },
    {
      key: "writing",
      label: "Writing",
      heading: "I write to learn it twice",
      body:
        "Courses on computer engineering subjects, essays and reviews, and fiction in chapters. Writing something down is how I find out whether I actually understood it.",
      links: [
        { href: "/courses", label: counts.lessons ? `Courses (${counts.lessons} lessons)` : "Courses" },
        { href: "/blog", label: counts.posts ? `Blog (${counts.posts})` : "Blog" },
        { href: "/stories", label: counts.stories ? `Stories (${counts.stories})` : "Stories" },
      ],
    },
    {
      key: "gallery",
      label: "Gallery",
      heading: "The other half",
      body:
        "Charcoal, photographs, interfaces and things made out of data. This is the part of the sheet where the pencil stops being a measuring tool.",
      links: [{ href: "/gallery", label: counts.galleryItems ? `Gallery (${counts.galleryItems})` : "Gallery" }],
    },
    {
      key: "sheet",
      label: "The sheet",
      heading: "That is the whole drawing",
      body: `Everything ${first} has published, on one page. The title block has the ways to reach him.`,
      links: [],
    },
  ];

  // The admin panel can override any heading or body without touching code.
  return base.map((item) => {
    const override = settings.home_copy?.[item.key];
    return override ? { ...item, heading: override.heading ?? item.heading, body: override.body ?? item.body } : item;
  });
}
