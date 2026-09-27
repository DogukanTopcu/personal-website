// TEMPORARY verification route. Delete before hand-off.
import LoadingAbout from "../../about/loading";
import LoadingPost from "../../blog/[slug]/loading";
import LoadingGallery from "../../gallery/loading";
import LoadingRoot from "../../loading";
import LoadingProject from "../../projects/[slug]/loading";
import LoadingWork from "../../projects/loading";
import LoadingChapter from "../../stories/[slug]/[chapter]/loading";
import LoadingStories from "../../stories/loading";

export default function Skeletons() {
  const all = [LoadingRoot, LoadingWork, LoadingProject, LoadingPost, LoadingStories, LoadingChapter, LoadingGallery, LoadingAbout];
  return (
    <>
      {all.map((C, i) => (
        <div key={i} style={{ borderBottom: "4px solid #e0473a" }}>
          <C />
        </div>
      ))}
    </>
  );
}
