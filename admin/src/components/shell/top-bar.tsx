"use client";

import { ArrowSquareOut, List, SignOut } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { AnchorButton, Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { SITE_URL } from "@/lib/env";
import { titleForPath } from "./nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

type TopBarProps = { email: string };

export function TopBar({ email }: TopBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline-strong bg-paper/95 px-4 backdrop-blur-none sm:px-6 lg:px-8">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label="Open navigation"
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <List size={18} aria-hidden="true" />
        </Button>
        <SheetContent side="left" title="Navigation" hideHeader className="w-[min(18rem,100vw)] px-0">
          <div className="-mx-5 -my-4 flex h-full flex-col">
            <div className="flex h-14 items-center border-b border-hairline px-5">
              <Wordmark />
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <h2 className="min-w-0 flex-1 truncate font-heading text-[0.9375rem] leading-none">{titleForPath(pathname)}</h2>

      <div className="flex items-center gap-1">
        <AnchorButton
          href={SITE_URL}
          target="_blank"
          rel="noopener"
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
        >
          View site
          <ArrowSquareOut size={14} aria-hidden="true" />
        </AnchorButton>
        <ThemeToggle />
        <form action={signOut}>
          <Tooltip label={email ? `Sign out ${email}` : "Sign out"}>
            <Button type="submit" variant="ghost" size="sm" icon aria-label="Sign out">
              <SignOut size={16} aria-hidden="true" />
            </Button>
          </Tooltip>
        </form>
      </div>
    </header>
  );
}
