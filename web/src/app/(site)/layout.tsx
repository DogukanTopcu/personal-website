import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { contactHref, getSettings } from "@/lib/data/settings";

/**
 * Every page except the home page. The home page is its own grammar: its
 * navigation is the map on the sheet, so it has no bar and no footer.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a className="skip-to-content link" href="#main">
        Skip to content
      </a>
      <SiteHeader wordmark={settings.full_name || "Doğukan Topçu"} contactHref={contactHref(settings)} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
