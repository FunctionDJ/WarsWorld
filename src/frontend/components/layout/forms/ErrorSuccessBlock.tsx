interface Props {
  isError?: boolean;
  title: string;
  message?: string;
  className?: string;
}

export default function ErrorSuccessBlock({ isError, message, title, className }: Props) {
  const color = isError == true ? "tw:bg-orange-star" : "tw:bg-green-earth";
  return (
    <div className={className}>
      <div
        className={`tw:flex tw:flex-col tw:text-center tw:h-full tw:justify-center ${color}/75 tw:smallscreen:mx-12 tw:mb-6 tw:p-2 tw:rounded-lg tw:gap-2`}
      >
        <div className="tw:flex tw:text-center tw:justify-center tw:items-center">
          <div
            className={`tw:font-medium tw:text-2xl tw:smallscreen:text-3xl ${color} tw:rounded-full tw:w-10 tw:smallscreen:w-12  tw:p-1`}
          >
            {isError == true ? <>✗</> : <>✓</>}
          </div>
          <p className="tw:text-white tw:text-center tw:h-auto tw:text-2xl tw:px-4">{title}</p>
        </div>
        {message !== undefined && <p className="tw:text-sm">{message}</p>}
      </div>
    </div>
  );
}
