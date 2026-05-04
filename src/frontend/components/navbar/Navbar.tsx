import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NavGroup } from "./NavGroup";

export function Navbar() {
  const [showMatchLinks, setShowMatchLinks] = useState(false);

  return (
    <header className="tw:w-screen tw:fixed tw:top-0 tw:z-40 tw:shadow-lg tw:shadow-bg-primary">
      <nav className="tw:flex tw:h-full tw:justify-between tw:items-center tw:bg-linear-to-r tw:from-bg-primary tw:via-bg-secondary tw:to-bg-primary tw:mx-auto tw:px-4 tw:smallscreen:px-8 tw:laptop:px-6">
        <div className="tw:relative tw:h-full tw:w-[25%] tw:smallscreen:w-[10%] tw:flex tw:flex-col tw:justify-center tw:align-middle">
          <Link
            className=" tw:absolute tw:left-4 tw:top-0 tw:flex tw:align-middle tw:justify-start"
            href="/"
          >
            <Image
              className="tw:w-16 tw:smallscreen:w-24"
              src="/img/layout/logo.webp"
              alt="AW Logo"
              width={0}
              height={0}
              sizes="100vw"
            />
          </Link>
        </div>

        <NavGroup showMatchLinks={showMatchLinks} setShowMatchLinks={setShowMatchLinks} />
      </nav>
    </header>
  );
}
