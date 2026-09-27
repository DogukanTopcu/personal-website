import type { Metadata } from "next";
import { ProjectForm } from "@/components/forms/project-form";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { PROJECT_DEFAULTS } from "@/lib/inputs";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { supabase } = await requireAdmin();
  const categories = await listCategories(supabase, "project");
  return <ProjectForm id={null} initial={PROJECT_DEFAULTS} categories={categories} />;
}
