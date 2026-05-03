import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  hasArrow?: boolean;
  isOpen?: boolean;
}

export default function NavButton({ children, isOpen, hasArrow }: Props) {
  return (
    <div className="tw:flex tw:h-full">
      <div className="tw:flex tw:items-center tw:text-white tw:hover:text-primary-light tw:text-2xl tw:tablet:text-3xl tw:laptop:text-xl tw:monitor:text-2xl tw:font-medium tw:large_monitor:text-4xl tw:text-center tw:h-full">
        {children}
      </div>
      {hasArrow == true && (
        <div
          className={`@flex @items-center @text-primary @font-mono @font-bold @text-2xl @duration-300 @px-1 @ml-2 ${
            isOpen == true && "tw:rotate-180 tw:translate-y-[-0.1rem]"
          }`}
        >
          &#x25BC;
        </div>
      )}
    </div>
  );
}
