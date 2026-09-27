import type { Metadata } from "next";
import { CategoriesManager } from "@/components/site/categories-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { countCategoryUsage, listCategories } from "@/lib/data/categories";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [categories, usage] = await Promise.all([listCategories(supabase), countCategoryUsage(supabase)]);

  return (
    <div>
      <PageHeader eyebrow="Site" title="Categories" description="Post and project categories, with the fallback cover used by entries without one. Drag to reorder." />
      <CategoriesManager key={categories.map((row) => `${row.id}:${row.updated_at}`).join("|")} categories={categories} usage={usage} />
    </div>
  );
}
