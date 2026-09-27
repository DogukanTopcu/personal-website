import type { Metadata } from "next";
import { PublicationForm } from "@/components/forms/publication-form";
import { requireAdmin } from "@/lib/auth";
import { PUBLICATION_DEFAULTS } from "@/lib/inputs";

export const metadata: Metadata = { title: "New publication" };

export default async function NewPublicationPage() {
  await requireAdmin();
  return <PublicationForm id={null} initial={{ ...PUBLICATION_DEFAULTS, year: new Date().getFullYear() }} />;
}
