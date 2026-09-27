import type { Metadata } from "next";
import { BackgroundsManager } from "@/components/site/backgrounds-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { getBackgroundSettings, listBackgrounds } from "@/lib/data/backgrounds";

export const metadata: Metadata = { title: "Backgrounds" };

export default async function BackgroundsPage() {
  const { supabase } = await requireAdmin();
  const [backgrounds, settings] = await Promise.all([listBackgrounds(supabase), getBackgroundSettings(supabase)]);

  return (
    <div>
      <PageHeader
        eyebrow="Site"
        title="Backgrounds"
        description="Full-screen pictures behind every page of the site, each with one picture for the light theme and one for the dark. Changes reach the site straight away."
      />
      <BackgroundsManager
        key={[settings.background_id, settings.background_picker, ...backgrounds.map((row) => `${row.id}:${row.updated_at}`)].join("|")}
        backgrounds={backgrounds}
        settings={settings}
      />
    </div>
  );
}
