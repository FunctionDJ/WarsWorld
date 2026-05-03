interface Props {
  title: string;
  tailwind_color?: string;
}

export default function TitleColorBox({ title, tailwind_color }: Props) {
  return (
    <div
      className={
        "tw:px-4 tw:rounded-md tw:w-full tw:text-center tw:my-2 tw:shadow-black/50 tw:shadow-md " +
        (tailwind_color ?? "tw:bg-blue-500")
      }
    >
      <h1 className="tw:py-0 tw:font-semibold tw:uppercase">{title}</h1>
    </div>
  );
}
