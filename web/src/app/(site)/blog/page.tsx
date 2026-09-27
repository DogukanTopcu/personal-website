import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { PageHead } from "@/components/site/PageHead";
import { listCategories } from "@/lib/data/categories";
import { listPosts } from "@/lib/data/posts";
import { formatDateShort, minutes } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays, and notes on the books, films and games I spend time with.",
  alternates: { canonical: "/blog" },
};

/** A rating drawn as ticks, not stars in a track. */
function Rating({ value }: { value: number }) {
  const filled = Math.round(value / 2);
  return (
    <span className="rating" title={`${value} out of 10`}>
      <span aria-hidden="true">
        {"|".repeat(filled)}
        <span className="rating__rest">{"|".repeat(5 - filled)}</span>
      </span>
      <span className="sr-only">{value} out of 10</span>
    </span>
  );
}

export default async function BlogPage(props: PageProps<"/blog">) {
  const [{ category, tag }, posts, categories] = await Promise.all([
    props.searchParams,
    listPosts(),
    listCategories("post"),
  ]);

  const activeCategory = typeof category === "string" ? category : null;
  const activeTag = typeof tag === "string" ? tag : null;
  const shown = posts.filter(
    (p) => (!activeCategory || p.category?.slug === activeCategory) && (!activeTag || p.tags.includes(activeTag)),
  );
  const used = categories.filter((c) => posts.some((p) => p.category?.slug === c.slug));

  return (
    <>
      <PageHead
        title="Writing"
        lede="Essays on whatever has my attention, and notes on the books, films and games I spend time with."
        meta={
          used.length > 1 && (
            <ul className="filters">
              <li>
                <Link href="/blog" aria-current={!activeCategory && !activeTag ? "true" : undefined}>
                  Everything
                </Link>
              </li>
              {used.map((c) => (
                <li key={c.slug}>
                  <Link href={`/blog?category=${c.slug}`} aria-current={activeCategory === c.slug ? "true" : undefined}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      >
        {activeTag && (
          <p className="t-small page-head__meta">
            Tagged <strong>{activeTag}</strong>.{" "}
            <Link className="link" href="/blog">
              Clear
            </Link>
          </p>
        )}
      </PageHead>

      <div className="wrap section">
        {shown.length === 0 ? (
          <Empty
            title="Nothing published here yet"
            body={activeCategory || activeTag ? "Nothing matches that filter yet. Try another one." : "Essays and reviews will appear here as they are written."}
          />
        ) : (
          <ul className="index">
            {shown.map((post) => (
              <li key={post.id}>
                <article className="entry">
                  <p className="entry__aside">
                    <time dateTime={post.published_at ?? undefined}>{formatDateShort(post.published_at)}</time>
                    <br />
                    {post.category?.name}
                  </p>
                  <div>
                    <h2 className="entry__title">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    {post.review?.subject && (
                      <p className="entry__review">
                        {post.review.subject}
                        {post.review.creator ? `, ${post.review.creator}` : ""}
                        {post.review.year ? ` (${post.review.year})` : ""}
                      </p>
                    )}
                    <p className="entry__body">{post.excerpt}</p>
                    {post.tags.length > 0 && (
                      <ul className="tags entry__foot">
                        {post.tags.slice(0, 5).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="entry__aside entry__trailing">
                    {typeof post.review?.rating === "number" && <Rating value={post.review.rating} />}
                    <span className="entry__minutes">{minutes(post.reading_minutes)}</span>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
