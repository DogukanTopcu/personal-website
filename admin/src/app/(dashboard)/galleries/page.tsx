import type { Metadata } from "next";
import { GalleriesManager } from "@/components/galleries/galleries-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { listGalleries } from "@/lib/data/galleries";

export const metadata: Metadata = { title: "Galleries" };

export default async function GalleriesPage() {
  const { supabase } = await requireAdmin();
  const galleries = await listGalleries(supabase);

  return (
    <div>
      <PageHeader eyebrow="Content" title="Galleries" description="Drag to change the order they appear in on the site. Open a gallery to manage its items." />
      <GalleriesManager key={galleries.map((gallery) => `${gallery.id}:${gallery.updated_at}`).join("|")} galleries={galleries} />
    </div>
  );
}
