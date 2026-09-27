import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { runtimeShort } from "@/components/site/format";
import { PageHead } from "@/components/site/PageHead";
import { listCategories } from "@/lib/data/categories";
import { listPosts } from "@/lib/data/posts";
import { formatDateShort } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays, and notes on the books, films and games I spend time with.",
  alternates: { canonical: "/blog" },
};

/**
 * The programme, set like a repertory cinema's listing: the date and the
 * strand on the left, the title and what it is about in the middle, the
 * runtime and (for a review) the score on the right.
 */
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
          <ul className="index programme-list">
            {shown.map((post) => {
              const review = post.review?.subject ? post.review : null;
              return (
                <li key={post.id}>
                  <article className="entry">
                    <p className="entry__aside entry__when">
                      <time dateTime={post.published_at ?? undefined}>{formatDateShort(post.published_at)}</time>
                      {post.category && <span>{post.category.name}</span>}
                    </p>
                    <div>
                      <h2 className="entry__title">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {review && (
                        <p className="entry__review">
                          <cite>{review.subject}</cite>
                          {review.creator ? `, ${review.creator}` : ""}
                          {review.year ? ` (${review.year})` : ""}
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
                      <span className="nums">{runtimeShort(post.reading_minutes)}</span>
                      {typeof post.review?.rating === "number" && (
                        <span className="rating nums">
                          <span className="sr-only">Rated </span>
                          {post.review.rating} / 10
                        </span>
                      )}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
