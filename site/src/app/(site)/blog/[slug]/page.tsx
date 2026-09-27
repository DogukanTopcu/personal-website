import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/Markdown";
import { Toc } from "@/components/content/Toc";
import { Frame } from "@/components/site/Frame";
import { PageHead } from "@/components/site/PageHead";
import { Pager } from "@/components/site/Pager";
import { adjacentPosts, getPost, listPosts } from "@/lib/data/posts";
import { formatDate, minutes } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown/render";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at ?? undefined,
      ...(post.cover_url ? { images: [post.cover_url] } : {}),
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [{ content, toc }, { newer, older }] = await Promise.all([renderMarkdown(post.content_md), adjacentPosts(slug)]);
  const review = post.review;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": review?.subject ? "Review" : "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `${siteUrl()}/blog/${post.slug}`,
    ...(review?.subject
      ? {
          itemReviewed: { "@type": "CreativeWork", name: review.subject, ...(review.creator ? { creator: review.creator } : {}) },
          ...(typeof review.rating === "number"
            ? { reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 10, worstRating: 0 } }
            : {}),
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHead
        crumbs={[
          { href: "/blog", label: "Writing" },
          ...(post.category ? [{ href: `/blog?category=${post.category.slug}`, label: post.category.name }] : []),
          { label: post.title },
        ]}
        title={post.title}
        lede={post.excerpt}
        meta={
          <p className="t-data">
            <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
            {" · "}
            {minutes(post.reading_minutes)}
          </p>
        }
      />

      <div className="wrap">
        {(post.cover_url || post.category?.cover_url) && (
          <div className="detail-cover">
            <Frame src={post.cover_url ?? post.category?.cover_url} alt={post.cover_alt} placeholder="Cover image" ratio="16 / 9" sizes="(min-width: 720px) 42rem, 100vw" priority />
          </div>
        )}

        <div className="reading">
          <div>
            {review?.subject && (
              <dl className="facts verdict">
                <div className="facts__row">
                  <dt className="facts__key">{post.category?.slug === "films" ? "Film" : post.category?.slug === "games" ? "Game" : "Book"}</dt>
                  <dd className="facts__value">
                    {review.subject}
                    {review.year ? ` (${review.year})` : ""}
                  </dd>
                </div>
                {review.creator && (
                  <div className="facts__row">
                    <dt className="facts__key">{post.category?.slug === "films" ? "Director" : post.category?.slug === "games" ? "Studio" : "Author"}</dt>
                    <dd className="facts__value">{review.creator}</dd>
                  </div>
                )}
                {typeof review.rating === "number" && (
                  <div className="facts__row">
                    <dt className="facts__key">Rating</dt>
                    <dd className="facts__value nums">{review.rating} out of 10</dd>
                  </div>
                )}
                {review.verdict && (
                  <div className="facts__row">
                    <dt className="facts__key">Verdict</dt>
                    <dd className="facts__value">{review.verdict}</dd>
                  </div>
                )}
              </dl>
            )}

            {content ? <Prose className="detail-prose">{content}</Prose> : null}

            {post.tags.length > 0 && (
              <ul className="tags detail-tags">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            )}

            <Pager
              previous={older ? { href: `/blog/${older.slug}`, title: older.title } : null}
              next={newer ? { href: `/blog/${newer.slug}`, title: newer.title } : null}
              previousLabel="Older"
              nextLabel="Newer"
            />
          </div>

          <aside className="reading__aside">
            <Toc entries={toc} />
          </aside>
        </div>
      </div>
    </>
  );
}
