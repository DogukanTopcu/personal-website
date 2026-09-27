import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryItemsManager } from "@/components/galleries/gallery-items-manager";
import { AnchorButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { getGallery, listGalleryItems } from "@/lib/data/galleries";
import { publicPaths, siteUrl } from "@/lib/paths";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const gallery = await getGallery(supabase, (await params).id);
  return { title: gallery ? gallery.title : "Gallery" };
}

export default async function GalleryPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const gallery = await getGallery(supabase, id);
  if (!gallery) notFound();
  const items = await listGalleryItems(supabase, gallery.id);

  return (
    <div>
      <Link href="/galleries" className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
        <ArrowLeft size={12} aria-hidden="true" />
        Galleries
      </Link>
      <PageHeader
        eyebrow={`/gallery/${gallery.slug}`}
        title={gallery.title}
        description={gallery.description}
        actions={
          <AnchorButton href={siteUrl(publicPaths.gallery(gallery.slug))} target="_blank" rel="noopener" size="sm">
            View on site
            <ArrowSquareOut size={14} aria-hidden="true" />
          </AnchorButton>
        }
      />
      <GalleryItemsManager key={gallery.id} gallery={gallery} items={items} />
    </div>
  );
}
