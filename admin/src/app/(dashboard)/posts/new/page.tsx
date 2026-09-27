import type { Metadata } from "next";
import { PostForm } from "@/components/forms/post-form";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { POST_DEFAULTS } from "@/lib/inputs";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const { supabase } = await requireAdmin();
  const categories = await listCategories(supabase, "post");
  return <PostForm id={null} initial={POST_DEFAULTS} categories={categories} />;
}
