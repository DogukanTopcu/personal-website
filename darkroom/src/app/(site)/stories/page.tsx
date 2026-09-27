import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { count, runtimeShort } from "@/components/site/format";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
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

/**
 * Stories are billed the way films are: a poster, the synopsis, and the reels
 * (here, the chapters) in the order they run. With no artwork, the poster is
 * the story's own title card.
 */
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
                <article key={story.id} className="story" aria-labelledby={`story-${story.slug}`}>
                  <Link className="story__poster" href={`/stories/${story.slug}`} tabIndex={-1} aria-hidden="true">
                    <Lamp>
                      <Frame
                        src={story.cover_url}
                        alt=""
                        placeholder={`Cover for ${story.title}`}
                        titleCard={story.title}
                        ratio="2 / 3"
                        className="card-fit card-fit--poster"
                        sizes="(min-width: 700px) 18rem, 8rem"
                      />
                    </Lamp>
                  </Link>

                  <header className="story__head">
                    <h2 id={`story-${story.slug}`} className="story__title">
                      <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                    </h2>
                    <p className="t-data story__meta">
                      {FORMAT[story.format] ?? story.format}
                      {story.genre ? ` · ${story.genre}` : ""}
                      {story.chapters.length > 0 && ` · ${count(story.chapters.length, "chapter")} · ${minutes(total)}`}
                      {story.is_complete ? " · Complete" : " · In progress"}
                    </p>
                  </header>

                  <p className="story__synopsis">{story.synopsis}</p>

                  {story.chapters.length > 0 && (
                    <ol className="contents story__contents" aria-label={`Chapters of ${story.title}`}>
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
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
