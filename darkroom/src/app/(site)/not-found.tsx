import { NotFoundCard } from "@/components/site/NotFoundCard";

/**
 * A page inside the site that does not exist (an unknown slug). Next renders
 * this inside the site layout, so the bar and the credits are already there:
 * the intertitle sits between them, and the layout's <main> stays the only one.
 */
export default function SiteNotFound() {
  return (
    <div className="status-page status-page--inset">
      <NotFoundCard />
    </div>
  );
}
