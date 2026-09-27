import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/forms/project-form";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { getProject } from "@/lib/data/projects";
import { toProjectInput } from "@/lib/inputs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const project = await getProject(supabase, (await params).id);
  return { title: project ? project.title || "Untitled project" : "Project" };
}

export default async function EditProjectPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [project, categories] = await Promise.all([getProject(supabase, id), listCategories(supabase, "project")]);
  if (!project) notFound();

  return <ProjectForm key={project.id} id={project.id} initial={toProjectInput(project)} categories={categories} />;
}
