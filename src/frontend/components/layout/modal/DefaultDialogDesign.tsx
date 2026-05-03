import { Dialog } from "@headlessui/react";
import type { ReactNode } from "react";
import PageTitle from "../PageTitle";
import OrangeGradientLine from "../decorations/OrangeGradientLine";

interface Props {
  width?: string;
  title?: string;
  children: ReactNode;
}

export default function DefaultDialogDesign({ children, width, title }: Props) {
  return (
    <>
      <div className="tw:fixed tw:inset-0 tw:bg-black/80" aria-hidden="true" />
      <div className="tw:fixed tw:inset-0 tw:w-screen tw:overflow-y-scroll">
        <div className="tw:flex tw:flex-col tw:min-h-full tw:items-center tw:justify-center tw:w-full">
          <div className="tw:py-16" style={{ width: width ?? "75vw" }}>
            <div className="tw:w-full tw:h-full tw:rounded-xl tw:overflow-hidden tw:shadow-xl tw:shadow-black">
              <Dialog.Panel className="tw:bg-bg-secondary">
                <PageTitle>{title}</PageTitle>
                {children}
                <OrangeGradientLine />
              </Dialog.Panel>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
