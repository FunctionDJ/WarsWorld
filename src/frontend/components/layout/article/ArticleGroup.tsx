import TitleColorBox from "../TitleColorBox";
import type { ICardInfo } from "./LinkCard";
import LinkCard from "./LinkCard";
import LinkCardContainer from "./LinkCardContainer";

interface Props {
  title: string;
  description: string;
  tailwind_color?: string;
  articles: ICardInfo[];
}

export default function ArticleGroup({ title, description, tailwind_color, articles }: Props) {
  return (
    <section>
      <div className="tw:flex tw:flex-col tw:py-2 tw:monitor:flex-row tw:items-center tw:monitor:space-x-8">
        <div className="tw:min-w-[75vw] tw:monitor:min-w-[20vw]">
          <TitleColorBox title={title} tailwind_color={tailwind_color} />
        </div>
        <p className="tw:text-center @tablet:@text-start">{description}</p>
      </div>
      <LinkCardContainer>
        {articles.map((item, index) => (
          <LinkCard key={`${title}-${String(index)}`} cardInfo={item} />
        ))}
      </LinkCardContainer>
    </section>
  );
}
