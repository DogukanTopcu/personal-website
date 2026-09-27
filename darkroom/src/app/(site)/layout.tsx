import type { ReactNode } from "react";
import { Bar } from "@/components/site/Bar";
import { Credits } from "@/components/site/Credits";
import { contactHref, getSettings } from "@/lib/data/settings";
import "./sections.css";

/** Every page except the home page, which is a screening with its own bar. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a className="skip-to-content" href="#main">
        Skip to content
      </a>
      <Bar wordmark={settings.full_name || "Doğukan Topçu"} contactHref={contactHref(settings)} />
      <main id="main">{children}</main>
      <Credits />
    </>
  );
}
