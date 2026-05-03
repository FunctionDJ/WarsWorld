import Image from "next/image";
import Link from "next/link";

const MAX_DESC_LENGTH = 120;
const MAX_TITLE_LENGTH = 48;

export interface ICardInfo {
  title: string;
  description: string;
  date?: string;
  category?: string;
  thumbnail: string;
  thumbnailAlt: string;
  subdirectory: string;
}

interface Props {
  cardInfo: ICardInfo;
}

export default function LinkCard({ cardInfo }: Props) {
  const trimmedTitle =
    cardInfo.title.length > MAX_TITLE_LENGTH
      ? cardInfo.title.substring(0, MAX_TITLE_LENGTH - 3) + "..."
      : cardInfo.title;
  const trimmedDescription =
    cardInfo.description.length > MAX_DESC_LENGTH
      ? cardInfo.description.substring(0, MAX_DESC_LENGTH - 3) + "..."
      : cardInfo.description;

  return (
    <div className="tw:relative tw:bg-black/50 tw:object-cover tw:h-[380px] tw:laptop:h-[478px] tw:ultra:h-[720px] tw:w-[320px] tw:laptop:w-[400px] tw:ultra:w-[640px] tw:transform tw:cursor-pointer tw:border-transparent tw:border-4 tw:hover:-translate-y-1 tw:hover:border-primary tw:hover:bg-gray-900/50 tw:tablet:hover:z-10 tw:duration-200 tw:ease-in">
      <Link href={cardInfo.subdirectory} className="tw:absolute tw:h-full tw:w-full tw:z-10" />
      <div className="tw:grid tw:grid-rows-2 tw:h-full">
        <Image
          className="tw:grid-rows-1 tw:w-[320px] tw:h-[180px] tw:laptop:w-[400px] tw:laptop:h-[225px] tw:ultra:w-[640px] tw:ultra:h-[360px] tw:object-cover"
          src={cardInfo.thumbnail}
          alt={cardInfo.thumbnailAlt}
          width={640}
          height={360}
        />
        <div className="tw:relative tw:grid-rows-1 tw:h-full tw:px-2 tw:laptop:px-4 tw:laptop:pb-4 tw:ultra:my-4">
          <h2 className="tw:text-2xl tw:ultra:text-4xl tw:font-semibold">{trimmedTitle}</h2>
          <p className="tw:ultra:text-2xl tw:ultra:mt-4">{trimmedDescription}</p>
          <p className="tw:absolute tw:bottom-2 tw:ultra:text-2xl tw:laptop:bottom-4 tw:right-2 tw:laptop:right-4 tw:ultra:bottom-8">
            {cardInfo.date}
          </p>
          <p className="tw:absolute tw:bottom-2 tw:ultra:text-2xl tw:laptop:bottom-4 tw:left-2 tw:laptop:left-4 tw:ultra:bottom-8">
            {cardInfo.category}
          </p>
          {/* <p className="tw:h-full">{cardInfo.text}</p> */}
        </div>
      </div>
    </div>
  );
}
