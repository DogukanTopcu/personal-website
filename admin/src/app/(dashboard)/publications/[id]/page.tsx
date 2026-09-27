import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicationForm } from "@/components/forms/publication-form";
import { requireAdmin } from "@/lib/auth";
import { getPublication } from "@/lib/data/publications";
import { toPublicationInput } from "@/lib/inputs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const publication = await getPublication(supabase, (await params).id);
  return { title: publication ? publication.title || "Untitled publication" : "Publication" };
}

export default async function EditPublicationPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const publication = await getPublication(supabase, id);
  if (!publication) notFound();

  return <PublicationForm key={publication.id} id={publication.id} initial={toPublicationInput(publication)} />;
}
