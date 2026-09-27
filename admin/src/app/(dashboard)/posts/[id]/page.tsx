import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/forms/post-form";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { getPost } from "@/lib/data/posts";
import { toPostInput } from "@/lib/inputs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const post = await getPost(supabase, (await params).id);
  return { title: post ? post.title || "Untitled post" : "Post" };
}

export default async function EditPostPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [post, categories] = await Promise.all([getPost(supabase, id), listCategories(supabase, "post")]);
  if (!post) notFound();

  return <PostForm key={post.id} id={post.id} initial={toPostInput(post)} categories={categories} />;
}
