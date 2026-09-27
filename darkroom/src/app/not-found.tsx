import { NotFoundCard } from "@/components/site/NotFoundCard";
import "./(site)/sections.css";

/**
 * An address that matches no route: a black screen, no bar and no credits,
 * one intertitle in the middle of it.
 */
export default function NotFound() {
  return (
    <main className="status-page">
      <NotFoundCard />
    </main>
  );
}
