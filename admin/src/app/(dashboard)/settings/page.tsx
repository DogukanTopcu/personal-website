import type { Metadata } from "next";
import { SettingsForm } from "@/components/site/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { toSettingsInput } from "@/lib/inputs";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const settings = await getSettings(supabase);

  return (
    <div>
      <PageHeader eyebrow="Site" title="Settings" description="Profile, bio, links and SEO. One row, one save button, Cmd/Ctrl+S works." />
      <SettingsForm key={settings.updated_at} initial={toSettingsInput(settings)} updatedAt={settings.updated_at} />
    </div>
  );
}
