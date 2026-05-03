import Image from "next/image";
export default function SmallContainer(props: {
  image: string;
  alt: string;
  title: string;
  text: string;
}) {
  return (
    <div className="tw:flex tw:rounded-2xl tw:relative tw:hover:scale-[1.015] tw:transition tw:drop-shadow-[10px_10px_10px_rgba(0,0,0,0.25)] tw:overflow-hidden">
      <Image
        className="tw:brightness-90 tw:h-auto tw:min-w-[250px]"
        src={`/img/layout/${props.image}.jpg`}
        alt={props.alt}
        width={380}
        height={600}
      />
      <div className="tw:text-center tw:p-2 tw:absolute tw:bottom-0 tw:z-10 tw:backdrop-brightness-[.3]">
        <h2 className="tw:text-white">
          <strong>{props.title}</strong>
        </h2>
        <p>{props.text}</p>
      </div>
    </div>
  );
}
