"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useLayoutEffect, useState } from "react";
import { useHydrated } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const THEME_STORAGE_KEY = "dt-admin-theme";

type Theme = "system" | "light" | "dark";

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/**
 * System, light or dark. The choice is written to localStorage and applied
 * before paint by the inline script in the root layout; this component only
 * has to keep the attribute in sync afterwards.
 */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState<Theme | null>(null);
  // Until hydration the server's "system" is shown; afterwards the stored choice.
  const theme: Theme = chosen ?? (hydrated ? readStored() : "system");

  // Re-apply after React's development remount clears the attribute the
  // inline script set. A no-op in production.
  useLayoutEffect(() => {
    apply(readStored());
  }, []);

  function choose(next: string) {
    const value: Theme = next === "light" || next === "dark" ? next : "system";
    setChosen(value);
    apply(value);
    try {
      if (value === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Desktop;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" icon aria-label="Theme">
          <Icon size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={choose}>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
