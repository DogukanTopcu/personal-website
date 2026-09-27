import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="dashed-frame mx-auto mt-12 max-w-lg px-6 py-10 text-center">
      <p className="eyebrow mb-2">Not found</p>
      <h1 className="text-lg">Nothing is drawn here.</h1>
      <p className="mt-2 text-[0.8125rem] text-ink-soft">The item may have been deleted, or the link is wrong.</p>
      <div className="mt-5 flex justify-center">
        <LinkButton href="/" variant="primary">
          Back to the dashboard
        </LinkButton>
      </div>
    </div>
  );
}
