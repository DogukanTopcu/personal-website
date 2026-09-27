import { SITE_URL } from "@/lib/env";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

/** Fixed left rail on wide screens. Phones get the same links in a sheet. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-hairline-strong bg-surface lg:flex">
      <div className="flex h-14 items-center border-b border-hairline px-5">
        <Wordmark />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks />
      </div>
      <p className="truncate border-t border-hairline px-5 py-3 font-mono text-[0.6875rem] text-ink-soft" title="Saves refresh this site">
        Publishing to {SITE_URL.replace(/^https?:\/\//, "")}
      </p>
    </aside>
  );
}
