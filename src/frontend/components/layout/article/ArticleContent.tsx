import styles from "frontend/styles/pages/articles.module.scss";

interface Props {
  contentHTML: string;
}

export default function ArticleContent({ contentHTML }: Props) {
  const headers = [...contentHTML.matchAll(/<h1+>(.*?)<\/h1*>/gm)];

  // Styling
  contentHTML = contentHTML.replaceAll(
    /<h2>/g,
    `<h2 class="tw:smallscreen:py-4 tw:px-2 tw:text-3xl tw:smallscreen:text-5xl tw:font-light">`,
  );
  contentHTML = contentHTML.replaceAll(
    /<p>/g,
    `<p class="tw:my-4 tw:px-2 tw:text-xl tw:smallscreen:text-2xl tw:font-light">`,
  );
  contentHTML = contentHTML.replaceAll(/<img/g, `<img class="tw:my-6"`);
  contentHTML = contentHTML.replaceAll(/<li>/g, `<li class="tw:ml-10 tw:my-4 tw:px-4 tw:text-xl">`);
  contentHTML = contentHTML.replaceAll(/<ol>/g, `<ol class="tw:smallscreen:ml-10 tw:list-disc">`);
  contentHTML = contentHTML.replaceAll(/<ul>/g, `<ul class="tw:list-disc">`);

  // Put IDs on headers so /articleName#header links to the header
  for (const header of headers) {
    contentHTML = contentHTML.replace(
      /<h1>/,
      `<h1 class="smallscreen:@py-5 @px-2 @text-4xl smallscreen:@text-6xl @font-medium " id="${header[1].replace(
        /\s/g,
        "-",
      )}">`,
    );
  }

  return (
    <div className="@w- tw:px-24">
      <div className="tw:grid tw:grid-cols-12 tw:py-12 tw:px-4 tw:smallscreen:pl-16 tw:relative tw:leading-10">
        <div className="tw:relative tw:col-span-12 tw:smallscreen:col-span-10">
          <article
            className={`tw:relative tw:min-h-[90vh] tw:bg-bg-tertiary tw:z-20 tw:smallscreen:p-10 tw:p-2 ${styles.articleGrid} tw:list-disc [&>p]:inline tw:rounded-2xl tw:shadow-xl tw:shadow-black`}
            dangerouslySetInnerHTML={{ __html: contentHTML }}
          />
          <div className="tw:absolute tw:z-10 tw:top-6 tw:left-6 tw:w-full tw:h-[99%] tw:-rotate-3 tw:bg-bg-secondary tw:rounded-2xl tw:shadow-xl tw:shadow-black" />
          <div className="tw:absolute tw:top-12 tw:left-8 tw:w-full tw:h-[95%] tw:rotate-[-5deg] tw:bg-bg-primary tw:rounded-2xl tw:shadow-xl tw:shadow-black" />
        </div>

        <div className="tw:z-30 tw:my-8 tw:smallscreen:my-0 tw:mx-0 tw:smallscreen:mx-2 tw:col-span-12 tw:smallscreen:col-span-2 tw:bg-black/70 tw:sticky tw:top-[10vw] tw:h-max tw:rounded-xl tw:shadow-lg tw:shadow-black">
          <h1 className="tw:text-3xl tw:text-center tw:my-2 ">INDEX</h1>
          {headers.map((item, index) => {
            return (
              <a
                key={item[1] + index}
                href={`#${item[1].replace(/\s/g, "-")}`}
                className={`@text-white ${
                  index % 2 == 0 ? "tw:bg-bg-tertiary" : "tw:bg-bg-secondary"
                } @text-base monitor:@text-xl @block @py-2 @px-2 hover:@text-white hover:@text-[1.3rem] @border-t-4 @border-white`}
              >
                {item[1]}
              </a>
            );
          })}
          <div className="tw:h-6 tw:border-t-4 tw:border-white" />
        </div>
      </div>
    </div>
  );
}
