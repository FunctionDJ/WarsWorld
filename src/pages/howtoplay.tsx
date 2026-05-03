import PageTitle from "frontend/components/layout/PageTitle";
import ArticleGroup from "frontend/components/layout/article/ArticleGroup";
import { type ICardInfo } from "frontend/components/news/FeaturedNewsCard";
import { stringToSlug } from "frontend/utils/articleUtils";
import { trpc } from "frontend/utils/trpc-client";
import Head from "next/head";

const data = [
  {
    title: "Basics",
    description:
      "If you are a new player, these guides will help you establish the basic fundamentals of the game",
    color: "tw:bg-green-500",
  },
  {
    title: "Matches",
    description: "You can learn here how you can create or join a match.",
  },
  {
    title: "Advance",
    description:
      "These guides will cover more advanced techniques with specific uses that can give you the edge on the battlefield.",
    color: "tw:bg-orange-500",
  },
];

export default function HowToPlay() {
  const { data: articleGuides } = trpc.article.getMetadataByType.useQuery({ type: "guide" });

  return (
    /*  
      Shows titles and loops through a list of sections that each contain a 
      title, description and any amount of clickable artciles or tutorials.
    */
    <>
      <Head>
        <title>Guides | Wars World</title>
      </Head>
      <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:align-middle">
        <div className="tw:w-full tw:mt-8">
          <PageTitle svgPathD="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z">
            How to Play
          </PageTitle>
        </div>

        <div className="tw:flex tw:flex-col tw:max-w-[95vw] tw:px-4 tw:py-8 tw:laptop:pb-12">
          <div className="tw:flex tw:flex-col tw:gap-8">
            {articleGuides &&
              data.map((section, index) => {
                return (
                  <ArticleGroup
                    key={index}
                    title={section.title}
                    description={section.description}
                    tailwind_color={section.color}
                    articles={articleGuides
                      .map<ICardInfo>((guide) => {
                        return {
                          subdirectory: `articles/${String(guide.id)}/${stringToSlug(guide.title)}`,
                          title: guide.title,
                          description: guide.description,
                          thumbnail: guide.thumbnail ?? "",
                          thumbnailAlt: guide.title,
                          date: guide.createdAt.toDateString(),
                          category: guide.category[0].toUpperCase() + guide.category.slice(1),
                        };
                      })
                      .filter(
                        (article) =>
                          article.category?.toLowerCase() == section.title.toLowerCase() ||
                          (section.title.toLowerCase() == "matches" &&
                            article.category?.toLowerCase() == "site"),
                      )}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
