import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty } from "@/components/site/Empty";
import { count, runtimeShort } from "@/components/site/format";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import { PageHead } from "@/components/site/PageHead";
import { getStory, listStories } from "@/lib/data/stories";
import { minutes } from "@/lib/format";

export const revalidate = 300;
export const dynamicParams = true;

const FORMAT: Record<string, string> = {
  novel: "Novel",
  novella: "Novella",
  "short-story": "Short story",
  collection: "Collection",
  serial: "Serial",
};

export async function generateStaticParams() {
  const stories = await listStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const story = await getStory(slug);
  if (!story) return { title: "Not found" };
  return {
    title: story.title,
    description: story.synopsis,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: { type: "book", title: story.title, description: story.synopsis, ...(story.cover_url ? { images: [story.cover_url] } : {}) },
  };
}

export default async function StoryPage(props: PageProps<"/stories/[slug]">) {
  const { slug } = await props.params;
  const story = await getStory(slug);
  if (!story) notFound();

  const total = story.chapters.reduce((n, c) => n + (c.reading_minutes ?? 1), 0);
  const parts = [...new Set(story.chapters.map((c) => c.part_title).filter(Boolean))];

  return (
    <>
      <PageHead
        crumbs={[{ href: "/stories", label: "Stories" }, { label: story.title }]}
        title={story.title}
        lede={story.synopsis}
        meta={
          <p className="t-data">
            {FORMAT[story.format] ?? story.format}
            {story.genre ? ` · ${story.genre}` : ""}
            {story.chapters.length > 0 && ` · ${count(story.chapters.length, "chapter")} · ${minutes(total)}`}
            {story.is_complete ? " · Complete" : " · In progress"}
          </p>
        }
      />

      <div className="wrap section story-detail">
        <Lamp className="story-detail__poster">
          <Frame
            src={story.cover_url}
            alt={story.cover_alt}
            placeholder={`Cover for ${story.title}`}
            titleCard={story.title}
            ratio="2 / 3"
            className="card-fit card-fit--poster"
            sizes="(min-width: 800px) 20rem, 60vw"
            priority
          />
        </Lamp>

        <section className="story-detail__contents" aria-labelledby="story-contents-title">
          <h2 id="story-contents-title" className="t-label story-detail__label">
            Contents
          </h2>
          {story.chapters.length === 0 ? (
            <Empty title="No chapters yet" body="The chapters of this story are still being written." />
          ) : (
            <>
              <ol className="contents">
                {story.chapters.map((chapter, index) => {
                  const isNewPart = chapter.part_title && chapter.part_title !== story.chapters[index - 1]?.part_title;
                  return (
                    <li key={chapter.id}>
                      {isNewPart && parts.length > 1 && <p className="contents__section">{chapter.part_title}</p>}
                      <Link className="contents__item" href={`/stories/${story.slug}/${chapter.slug}`}>
                        <span className="contents__number nums">{String(index + 1).padStart(2, "0")}</span>
                        <span className="contents__title">{chapter.title}</span>
                        <span className="contents__meta nums">{runtimeShort(chapter.reading_minutes)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <Link className="btn btn--primary story-detail__start" href={`/stories/${story.slug}/${story.chapters[0].slug}`}>
                Start reading
              </Link>
            </>
          )}
        </section>
      </div>
    </>
  );
}
