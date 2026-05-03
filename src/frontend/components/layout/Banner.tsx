import Image from "next/image";

export default function Banner2(props: {
  title: React.ReactElement | React.ReactElement[];
  backgroundURL: string;
}) {
  return (
    <div className="tw:relative tw:h-[65vh] tw:w-full tw:tablet:h-[90vh] tw:overflow-hidden tw:shadow-black tw:shadow-2xl">
      <Image
        className="tw:object-cover tw:object-top tw:w-full tw:absolute tw:h-full tw:z-0"
        alt=""
        src={props.backgroundURL}
        width={0}
        height={0}
        sizes="100vw"
      />
      <div className="tw:absolute tw:flex tw:items-start tw:gap-10 tw:h-full tw:w-full tw:backdrop-brightness-[0.15] tw:z-10"></div>
      <div className="tw:flex tw:items-start tw:gap-10 tw:h-full tw:w-full tw:absolute tw:z-20">
        <div className="tw:h-full tw:w-full">{props.title}</div>
      </div>
    </div>
  );
}
