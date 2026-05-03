import type { ChangeEventHandler } from "react";

interface Props {
  text: string;
  name?: string;
  className?: string;
  isError?: boolean;
  height?: string;
  errorMessage?: string;
  value?: string | number | readonly string[];
  id?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

export default function TextAreaInput({
  text,
  name,
  id,
  value,
  isError,
  errorMessage,
  onChange,
  className,
  height,
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={id ?? ""} className="tw:text-xl tw:smallscreen:text-2xl tw:text-white">
        {text}
      </label>
      <textarea
        className={`@mt-2 @w-full @text-white @p-4 @text-xl smallscreen:@text-2xl @border-[2.5px] @rounded-2xl @bg-black/50 ${
          isError == true ? "tw:border-orange-star" : "tw:border-primary"
        }`}
        name={name}
        style={{ height }}
        placeholder="Write here... "
        value={value}
        onChange={onChange}
      />
      {isError == true && errorMessage != "" && (
        <p className="tw:text-white tw:bg-orange-star/80 tw:my-2 tw:px-2 tw:rounded-lg">{errorMessage}</p>
      )}
    </div>
  );
}
