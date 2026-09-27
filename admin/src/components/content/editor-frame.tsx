import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EditorFrameProps = {
  backHref: string;
  backLabel: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  /** The sticky right column: publish panel plus meta sections. */
  side: ReactNode;
  children: ReactNode;
};

/** Two columns: fields on the left, publish and meta on the right (sticky). Stacks on small screens. */
export function EditorFrame({ backHref, backLabel, eyebrow, title, side, children }: EditorFrameProps) {
  return (
    <div>
      <div className="mb-6">
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
          <ArrowLeft size={12} aria-hidden="true" />
          {backLabel}
        </Link>
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h1 className="truncate text-xl leading-7 sm:text-2xl sm:leading-8">{title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
        <aside className="flex flex-col gap-5 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto">{side}</aside>
      </div>
    </div>
  );
}

type PanelSectionProps = { title: ReactNode; children: ReactNode; className?: string };

/** A boxed group of fields in the side column. */
export function PanelSection({ title, children, className }: PanelSectionProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-hairline-strong bg-surface", className)}>
      <h2 className="eyebrow border-b border-hairline px-4 py-2.5">{title}</h2>
      <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
    </section>
  );
}

/** A group of fields in the main column with an optional heading. */
export function FieldGroup({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title ? <h2 className="eyebrow">{title}</h2> : null}
      {children}
    </section>
  );
}
