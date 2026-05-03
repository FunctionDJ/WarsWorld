import { useEffect, useState } from "react";

export interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  options: SelectOption[];
  value?: SelectOption;
  onChange: (value: SelectOption | undefined) => void;
  className?: string;
}

export default function Select({ value, onChange, options, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  function selectOption(option: SelectOption) {
    option !== value && onChange(option);
  }
  function isOptionSelected(option: SelectOption) {
    return option.value === value?.value;
  }

  useEffect(() => {
    isOpen && setHighlightedIndex(0);
  }, [isOpen]);

  return (
    <div className={className}>
      <div
        onBlur={() => {
          setIsOpen(false);
        }}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        tabIndex={0}
        className="tw:relative tw:cursor-pointer tw:w-full tw:h-full tw:border tw:border-bg-tertiary tw:flex tw:items-center tw:gap-2 tw:p-2 tw:rounded tw:outline-hidden tw:bg-bg-tertiary tw:shadow-black/70 tw:shadow-md"
      >
        <span className="tw:grow tw:text-white tw:pl-2">{value?.label}</span>
        <div className="tw:bg-bg-secondary tw:w-0.5 tw:self-stretch"></div>
        <div className={`tw:font-mono tw:text-lg tw:duration-300 tw:px-1 ${isOpen && "tw:rotate-180"}`}>
          &#x25BC;
        </div>
        <ul
          className={`@absolute @m-0 @p-0 @list-none @overflow-y-auto no-scrollbar @shadow-black @shadow-lg @rounded @w-full @left-0 @top-[calc(100%_+_0.5em)] 
            @bg-bg-tertiary @z-50 @duration-500
            ${isOpen ? "tw:max-h-96" : "tw:max-h-0"}`}
        >
          {options.map((option, index) => (
            <li
              onClick={(e) => {
                e.stopPropagation();
                selectOption(option);
                setIsOpen(false);
              }}
              onMouseEnter={() => {
                setHighlightedIndex(index);
              }}
              key={option.value}
              className={`@py-2 @px-4 @cursor-pointer 
                ${isOptionSelected(option) && "tw:bg-blue-500 tw:hover:bg-blue-900"}
                ${index === highlightedIndex && "tw:bg-bg-secondary"}
                `}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
