import type { ReactNode } from "react";
import OrangeGradientLine from "./decorations/OrangeGradientLine";

interface Props {
  children: ReactNode;
  svgPathD?: string;
}

export default function PageTitle({ children, svgPathD }: Props) {
  return (
    <div className="tw:relative tw:w-full tw:bg-linear-to-r tw:from-black/75 tw:to-bg-primary/40">
      <OrangeGradientLine />

      {svgPathD != undefined && (
        <svg
          className="tw:absolute tw:z-20 tw:-top-2 tw:smallscreen:-top-5 tw:-left-12 tw:smallscreen:left-12 tw:fill-primary tw:h-24 tw:smallscreen:h-36 tw:-rotate-12"
          xmlns="http://www.w3.org/2000/svg"
          height="200"
          viewBox="0 -960 960 960"
          width="200"
        >
          <path d={svgPathD} />
        </svg>
      )}

      <div
        className={`@relative ${
          svgPathD != undefined ? "tw:pl-32 tw:smallscreen:pl-64" : "tw:pl-10 tw:smallscreen:pl-20"
        } @py-4 @text-3xl smallscreen:@text-6xl @font-medium`}
      >
        {children}
      </div>

      <OrangeGradientLine />
    </div>
  );
}
