import type { Metadata } from "next";
import { ExperienceManager } from "@/components/site/experience-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { listExperiences } from "@/lib/data/experiences";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperiencePage() {
  const { supabase } = await requireAdmin();
  const rows = await listExperiences(supabase);

  return (
    <div>
      <PageHeader eyebrow="Site" title="Experience" description="Work, ventures, education, leadership and awards on the about page. Current entries also appear under Now on the home page, and the first education entry under Studied. Drag to reorder within a group." />
      <ExperienceManager key={rows.map((row) => `${row.id}:${row.updated_at}`).join("|")} rows={rows} />
    </div>
  );
}
