import type { ChangeEventHandler } from "react";

interface Props {
  text: string;
  className?: string;
  isError?: boolean;
  errorMessage?: string;
  value?: string | number | readonly string[];
  id?: string;
  type?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export default function FormInput({
  text,
  id,
  type,
  value,
  isError,
  errorMessage,
  onChange,
  className,
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={id ?? ""} className="tw:text-xl tw:smallscreen:text-2xl tw:text-white">
        {text}
      </label>
      <input
        id={id ?? ""}
        name={id ?? ""}
        type={type ?? ""}
        onChange={onChange}
        value={value}
        className={`@text-white @border-[2.5px] @text-xl smallscreen:@text-2xl @w-full @p-3 @mt-2 @rounded-xl @bg-black/50 ${
          isError == true ? "tw:border-orange-star" : "tw:border-primary"
        }`}
      />
      {isError == true && errorMessage != "" && (
        <p className="tw:text-white tw:bg-orange-star/80 tw:my-2 tw:px-2 tw:rounded-lg">{errorMessage}</p>
      )}
    </div>
  );
}
