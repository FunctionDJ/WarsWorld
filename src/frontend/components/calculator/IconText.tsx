interface Props {
  icon: string;
  text?: number;
}

export default function IconText({ icon, text }: Props) {
  return (
    <div className="tw:flex tw:items-center tw:justify-center tw:px-2 ">
      <img className="tw:[image-rendering:pixelated] tw:w-7" src={`/img/CO/${icon}.gif`} alt="" />
      {text != undefined ? <p className="tw:px-4">{text}</p> : ""}
    </div>
  );
}
