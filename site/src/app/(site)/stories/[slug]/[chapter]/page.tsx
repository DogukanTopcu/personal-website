import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/Markdown";
import { PageHead } from "@/components/site/PageHead";
import { Pager } from "@/components/site/Pager";
import { getChapter, listStories } from "@/lib/data/stories";
import { minutes } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown/render";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const stories = await listStories();
  return stories.flatMap((story) => story.chapters.map((chapter) => ({ slug: story.slug, chapter: chapter.slug })));
}

export async function generateMetadata(props: PageProps<"/stories/[slug]/[chapter]">): Promise<Metadata> {
  const { slug, chapter } = await props.params;
  const found = await getChapter(slug, chapter);
  if (!found) return { title: "Not found" };
  return {
    title: `${found.chapter.title} · ${found.story.title}`,
    description: found.story.synopsis,
    alternates: { canonical: `/stories/${slug}/${chapter}` },
  };
}

export default async function ChapterPage(props: PageProps<"/stories/[slug]/[chapter]">) {
  const { slug, chapter: chapterSlug } = await props.params;
  const found = await getChapter(slug, chapterSlug);
  if (!found) notFound();

  const { story, chapter, index } = found;
  const { content } = await renderMarkdown(chapter.content_md);
  const previous = story.chapters[index - 1];
  const next = story.chapters[index + 1];

  return (
    <>
      <PageHead
        crumbs={[
          { href: "/stories", label: "Stories" },
          { href: `/stories/${story.slug}`, label: story.title },
          { label: chapter.title },
        ]}
        title={chapter.title}
        meta={
          <p className="t-data">
            {chapter.part_title ? `${chapter.part_title} · ` : ""}Chapter <span className="nums">{index + 1}</span> of{" "}
            <span className="nums">{story.chapters.length}</span> · {minutes(chapter.reading_minutes)}
          </p>
        }
      />

      <div className="wrap chapter">
        {/* Fiction gets its own measure and indented paragraphs. No contents
            rail: a chapter is read start to finish, not scanned. */}
        {content && <Prose fiction className="chapter__prose">{content}</Prose>}

        <Pager
          previous={previous ? { href: `/stories/${story.slug}/${previous.slug}`, title: previous.title } : null}
          next={next ? { href: `/stories/${story.slug}/${next.slug}`, title: next.title } : null}
        />

        <p className="lesson-end t-small">
          {next ? (
            <>
              <Link className="link" href={`/stories/${story.slug}`}>
                All chapters of {story.title}
              </Link>
              .
            </>
          ) : (
            <>
              That is the end of {story.title}.{" "}
              <Link className="link" href="/stories">
                Read another
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </>
  );
}
