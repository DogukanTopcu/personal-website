"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { HOME_ITEM, NAV_GROUPS, type NavItem } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 pr-3 pl-4 text-[0.8125rem] outline-none",
        "before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:origin-top before:scale-y-0 before:bg-ink before:transition-transform before:duration-150 before:ease-ink",
        "hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
        active ? "font-medium text-ink before:scale-y-100" : "text-ink-soft",
      )}
    >
      <Icon size={16} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

type NavLinksProps = { onNavigate?: () => void };

/** The grouped navigation. Rendered inside the sidebar and the phone sheet. */
export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="flex flex-col gap-6">
      <div>
        <NavLink item={HOME_ITEM} pathname={pathname} onNavigate={onNavigate} />
      </div>
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="eyebrow mb-1 pl-4">{group.label}</p>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}
