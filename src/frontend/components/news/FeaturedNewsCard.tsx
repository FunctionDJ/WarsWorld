import Image from "next/image";
import Link from "next/link";
import OrangeGradientLine from "../layout/decorations/OrangeGradientLine";

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

export function FeaturedNewsCard({ cardInfo }: Props) {
  return (
    <div className="tw:hover:-translate-y-1 tw:laptop:hover:translate-y-0  tw:duration-500 tw:ease-in-out">
      <OrangeGradientLine />
      <div className="tw:overflow-hidden">
        <div className="tw:w-full tw:laptop:w-[101%] tw:h-144 tw:smallscreen:h-192 tw:laptop:h-[380px] tw:desktop:h-[398px] tw:monitor:h-[596px] tw:large_monitor:h-[740px] tw:ultra:h-[1100px] translate-x-0 tw:laptop:-translate-x-4 tw:laptop:hover:translate-x-0 tw:duration-500 tw:ease-in-out">
          <Link href={cardInfo.subdirectory} className="tw:w-full tw:h-full tw:z-10">
            <div className="tw:flex tw:flex-col-reverse tw:laptop:flex-row @justify-left tw:items-center tw:w-full tw:bg-black/50 tw:hover:bg-gray-950/50 tw:h-full tw:duration-200 tw:ease-in">
              <div className="tw:relative tw:w-full tw:laptop:w-[65%] tw:h-full tw:px-8 tw:laptop:py-8 tw:laptop:ml-6 tw:large_monitor:ml-28">
                <h2 className="tw:text-4xl tw:monitor:text-6xl tw:large_monitor:text-8xl tw:font-semibold tw:my-4 tw:monitor:my-8">
                  {cardInfo.title}
                </h2>
                <div className="tw:text-white">
                  <p className="tw:text-xl tw:laptop:text-2xl tw:large_monitor:text-4xl smalscreen:@my-2">
                    {cardInfo.description}
                  </p>
                  <p className="tw:absolute tw:bottom-4 tw:smallscreen:bottom-10 tw:text-xl tw:laptop:text-2xl tw:large_monitor:text-4xl">
                    {cardInfo.date}
                  </p>
                  <p className="tw:absolute tw:bottom-4 tw:laptop:bottom-10 tw:right-12 tw:text-xl tw:smallscreen:text-2xl tw:large_monitor:text-4xl">
                    {cardInfo.category}
                  </p>
                </div>
              </div>
              <Image
                className="tw:w-full tw:laptop:w-[640px] tw:desktop:w-[672px] tw:monitor:w-[1024px] tw:large_monitor:w-[1280px] tw:ultra:w-[1920px] tw:h-auto tw:laptop:h-[360px] tw:desktop:h-[378px] tw:monitor:h-[576px] tw:large_monitor:h-[720px] tw:ultra:h-[1080px] tw:object-cover tw:smallscreen:mr-4"
                src={cardInfo.thumbnail}
                alt={cardInfo.thumbnailAlt}
                width={1920}
                height={1080}
                priority
              />
            </div>
          </Link>
        </div>
      </div>
      <OrangeGradientLine />
    </div>
  );
}
