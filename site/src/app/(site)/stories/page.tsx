import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { Frame } from "@/components/site/Frame";
import { PageHead } from "@/components/site/PageHead";
import { listStories } from "@/lib/data/stories";
import { minutes } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Stories",
  description: "Fiction, written in chapters.",
  alternates: { canonical: "/stories" },
};

const FORMAT: Record<string, string> = {
  novel: "Novel",
  novella: "Novella",
  "short-story": "Short story",
  collection: "Collection",
  serial: "Serial",
};

/** Stories are shown the way books are: a cover, a synopsis, and the contents. */
export default async function StoriesPage() {
  const stories = await listStories();

  return (
    <>
      <PageHead title="Stories" lede="Fiction. Each one is written in chapters, in the order they are meant to be read." />

      <div className="wrap section">
        {stories.length === 0 ? (
          <Empty title="No stories published yet" body="Fiction will appear here once the first chapters are finished." />
        ) : (
          <div className="story-list">
            {stories.map((story) => {
              const total = story.chapters.reduce((n, c) => n + (c.reading_minutes ?? 1), 0);
              const parts = [...new Set(story.chapters.map((c) => c.part_title).filter(Boolean))];
              return (
                <article key={story.id} className="story">
                  <Frame
                    src={story.cover_url}
                    alt={story.cover_alt}
                    placeholder={`Cover for ${story.title}`}
                    ratio="2 / 3"
                    sizes="(min-width: 900px) 18rem, 60vw"
                    className="story__cover"
                  />
                  <div className="story__text">
                    <p className="entry__aside">
                      {FORMAT[story.format] ?? story.format}
                      {story.genre ? ` · ${story.genre}` : ""}
                      {story.chapters.length > 0 && ` · ${story.chapters.length} chapter${story.chapters.length === 1 ? "" : "s"} · ${minutes(total)}`}
                      {!story.is_complete && " · In progress"}
                    </p>
                    <h2 className="t-h2">
                      <Link className="link" href={`/stories/${story.slug}`}>
                        {story.title}
                      </Link>
                    </h2>
                    <p className="entry__body">{story.synopsis}</p>
                    {story.chapters.length > 0 && (
                      <ol className="contents story__contents">
                        {story.chapters.map((chapter, index) => {
                          const isNewPart = chapter.part_title && chapter.part_title !== story.chapters[index - 1]?.part_title;
                          return (
                            <li key={chapter.id}>
                              {isNewPart && parts.length > 1 && <p className="contents__section">{chapter.part_title}</p>}
                              <Link className="contents__item" href={`/stories/${story.slug}/${chapter.slug}`}>
                                <span className="contents__number nums">{String(index + 1).padStart(2, "0")}</span>
                                <span className="contents__title">{chapter.title}</span>
                                <span className="contents__meta nums">{minutes(chapter.reading_minutes)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
