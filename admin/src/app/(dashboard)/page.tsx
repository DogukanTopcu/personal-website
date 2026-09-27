import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMark } from "@/components/ui/status-mark";
import { Time } from "@/components/ui/time";
import { requireAdmin } from "@/lib/auth";
import { getDashboard, KIND_LABELS, type ActivityItem } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_CREATE = [
  { href: "/posts/new", label: "New post" },
  { href: "/projects/new", label: "New project" },
  { href: "/courses/new", label: "New course" },
  { href: "/stories/new", label: "New story" },
  { href: "/publications/new", label: "New publication" },
];

function ActivityList({ title, items, empty }: { title: string; items: ActivityItem[]; empty: string }) {
  return (
    <section>
      <h2 className="eyebrow mb-3">{title}</h2>
      {items.length === 0 ? (
        <EmptyState className="py-8">{empty}</EmptyState>
      ) : (
        <ul className="border-y border-hairline-strong">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 border-b border-hairline py-2.5 last:border-b-0">
              <span className="w-20 shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-soft">
                {KIND_LABELS[item.kind]}
              </span>
              <Link href={item.href} className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium hover:underline">
                {item.title || "Untitled"}
              </Link>
              <StatusMark status={item.status} publishedAt={item.published_at} className="hidden sm:inline-flex" />
              <Time iso={item.updated_at} mode="relative" className="w-20 shrink-0 text-right font-mono text-[0.6875rem] text-ink-soft" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const { counts, drafts, recent } = await getDashboard(supabase);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        actions={QUICK_CREATE.map((item) => (
          <LinkButton key={item.href} href={item.href} size="sm">
            {item.label}
          </LinkButton>
        ))}
      />

      <section aria-label="Counts" className="mb-10 grid grid-cols-2 border-t border-l border-hairline-strong sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            className="group flex flex-col gap-3 border-r border-b border-hairline-strong p-4 hover:bg-surface"
          >
            <span className="text-[0.8125rem] font-medium">{entry.label}</span>
            <span className="font-heading text-3xl leading-none">{entry.published}</span>
            <span className="font-mono text-[0.6875rem] text-ink-soft">
              published
              {entry.draft > 0 ? `, ${entry.draft} draft${entry.draft === 1 ? "" : "s"}` : ""}
              {entry.detail ? <span className="block">{entry.detail}</span> : null}
            </span>
          </Link>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <ActivityList title="Latest drafts" items={drafts} empty="No drafts. Everything is either published or not started." />
        <ActivityList title="Recently updated" items={recent} empty="Nothing has been edited yet." />
      </div>
    </div>
  );
}
