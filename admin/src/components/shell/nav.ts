import type { Icon } from "@phosphor-icons/react";
import {
  Article,
  BookOpenText,
  Briefcase,
  Cube,
  FolderOpen,
  Gear,
  GraduationCap,
  ImageSquare,
  Images,
  Scroll,
  SquaresFour,
  Tag,
} from "@phosphor-icons/react";

export type NavItem = { href: string; label: string; icon: Icon };
export type NavGroup = { label: string; items: NavItem[] };

export const HOME_ITEM: NavItem = { href: "/", label: "Dashboard", icon: SquaresFour };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Content",
    items: [
      { href: "/posts", label: "Posts", icon: Article },
      { href: "/projects", label: "Projects", icon: Cube },
      { href: "/courses", label: "Courses", icon: GraduationCap },
      { href: "/stories", label: "Stories", icon: BookOpenText },
      { href: "/publications", label: "Publications", icon: Scroll },
      { href: "/galleries", label: "Galleries", icon: Images },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/experience", label: "Experience", icon: Briefcase },
      { href: "/categories", label: "Categories", icon: Tag },
      { href: "/backgrounds", label: "Backgrounds", icon: ImageSquare },
      { href: "/media", label: "Media", icon: FolderOpen },
      { href: "/settings", label: "Settings", icon: Gear },
    ],
  },
];

const SECTION_TITLES: Record<string, { list: string; singular: string }> = {
  posts: { list: "Posts", singular: "post" },
  projects: { list: "Projects", singular: "project" },
  courses: { list: "Courses", singular: "course" },
  stories: { list: "Stories", singular: "story" },
  publications: { list: "Publications", singular: "publication" },
  galleries: { list: "Galleries", singular: "gallery" },
  experience: { list: "Experience", singular: "experience" },
  categories: { list: "Categories", singular: "category" },
  backgrounds: { list: "Backgrounds", singular: "background" },
  media: { list: "Media", singular: "media" },
  settings: { list: "Settings", singular: "settings" },
};

/** The top bar title for a pathname: "Posts", "New post", "Edit lesson". */
export function titleForPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";

  const section = SECTION_TITLES[parts[0]];
  if (!section) return "Admin";
  if (parts.length === 1) return section.list;

  // /courses/[id]/lessons/new, /stories/[id]/chapters/[chapterId]
  if (parts.length >= 3 && (parts[2] === "lessons" || parts[2] === "chapters")) {
    const child = parts[2] === "lessons" ? "lesson" : "chapter";
    return parts[3] === "new" ? `New ${child}` : `Edit ${child}`;
  }

  if (parts[1] === "new") return `New ${section.singular}`;
  if (parts[0] === "galleries") return "Gallery";
  return `Edit ${section.singular}`;
}
