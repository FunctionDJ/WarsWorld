import Banner from "frontend/components/layout/Banner";
import Head from "next/head";
import type { ArticleType } from "server/routers/article";
import type { ArticleCommentsWithPlayer } from "shared/schemas/article";
import ArticleCommentSection from "./ArticleCommentSection";
import ArticleContent from "./ArticleContent";

interface Props {
  articleData: {
    type: ArticleType;
    contentHtml: string;
    metaData: {
      title: string;
      description: string;
      createdAt: string;
      category: string;
      thumbnail: string;
      thumbnailAlt: string;
    };
    comments: ArticleCommentsWithPlayer;
  };
}

export default function Article({ articleData }: Props) {
  // Lets make sure we have our parameters/data
  // before loading so we dont cause any errors
  if (typeof articleData === "undefined") {
    return <h1>Loading...</h1>;
  } else {
    // Get headers for index table

    return (
      <>
        <Head>
          <title>{`${articleData.type[0].toUpperCase() + articleData.type.slice(1)} | ${
            articleData.metaData.title
          }`}</title>
          <meta name="description" content={articleData.metaData.description} />
        </Head>

        <Banner
          title={
            <div className="tw:mx-[5vw] tw:my-[7.5vh]">
              <h2 className="tw:bg-bg-secondary tw:inline-block tw:py-2 tw:px-4 tw:smallscreen:py-4 tw:smallscreen:px-6 tw:text-xl tw:smallscreen:text-5xl tw:text-white tw:font-medium">
                {articleData.type.toUpperCase()}
              </h2>
              <h2 className="tw:bg-white tw:inline-block tw:py-2 tw:px-4 tw:smallscreen:py-4 tw:smallscreen:px-6 tw:text-xl tw:smallscreen:text-5xl tw:text-black tw:font-medium">
                {articleData.metaData.category.toUpperCase()}
              </h2>
              <h1 className="tw:text-2xl tw:smallscreen:text-6xl tw:large_monitor:text-8xl tw:font-semibold tw:my-6 tw:smallscreen:pr-12">
                {articleData.metaData.title}
              </h1>
              <h1 className="tw:text-lg tw:smallscreen:text-3xl tw:large_monitor:text-6xl tw:smallscreen:pr-12">
                {articleData.metaData.description}
              </h1>
            </div>
          }
          backgroundURL={articleData.metaData.thumbnail}
        />

        <ArticleContent contentHTML={articleData.contentHtml} />

        <ArticleCommentSection comments={articleData.comments} />
      </>
    );
  }
}
