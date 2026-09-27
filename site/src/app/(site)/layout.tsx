import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { NO_BACKGROUND, toLook } from "@/lib/background";
import { listBackgrounds } from "@/lib/data/backgrounds";
import { getSettings } from "@/lib/data/settings";

/** Every page, the home page included, shares one header and one footer. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, backgrounds] = await Promise.all([getSettings(), listBackgrounds()]);
  const looks = backgrounds.map(toLook);
  const fallback = looks.some((look) => look.id === settings.background_id) ? (settings.background_id as string) : NO_BACKGROUND;
  return (
    <>
      <a className="skip-to-content" href="#main">
        Skip to content
      </a>
      <SiteHeader
        name={settings.full_name || "Doğukan Topçu"}
        backgrounds={settings.background_picker ? looks : []}
        fallbackBackground={fallback}
      />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
