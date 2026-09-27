import type { Metadata } from "next";
import { MediaLibrary } from "@/components/media/media-library";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        eyebrow="Site"
        title="Media"
        description="Every file in the media bucket. Uploads land in year/month folders and keep a one-year cache header."
      />
      <MediaLibrary />
    </div>
  );
}
