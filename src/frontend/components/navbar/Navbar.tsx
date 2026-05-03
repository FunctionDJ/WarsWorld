import { useWindowWidth } from "@react-hook/window-size";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NavGroup } from "./NavGroup";
import { NavGroupMobile } from "./NavGroupMobile";
import NavLoginLogout from "./NavLoginLogout";

export function Navbar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const windowWidth = useWindowWidth();
  const [showLinks, setShowLinks] = useState(false);
  const [showMatchLinks, setShowMatchLinks] = useState(false);
  const [isMobileWidth, setIsMobileWidth] = useState(false);
  const isOpen = searchParams.has("authModalOpen");

  const setIsOpen = async (value: boolean, callbackUrl?: string) => {
    if (value) {
      await router.replace("", {
        pathname: window.location.pathname,
        query: "authModalOpen",
      });
    } else {
      await router.replace(
        callbackUrl ?? {
          pathname: window.location.pathname,
          query: "",
        },
      );
    }
  };

  const handleBurgerMenu = () => {
    setShowLinks(!showLinks);
  };

  useEffect(() => {
    if (windowWidth >= 1024) {
      setIsMobileWidth(true);
    } else {
      setIsMobileWidth(false);
    }
  }, [windowWidth]);

  return (
    <header className="tw:w-screen tw:fixed tw:top-0 tw:z-40 tw:shadow-lg tw:shadow-bg-primary">
      <nav className="tw:flex tw:h-full tw:justify-between tw:items-center tw:bg-linear-to-r tw:from-bg-primary tw:via-bg-secondary tw:to-bg-primary tw:mx-auto tw:px-4 tw:smallscreen:px-8 tw:laptop:px-6">
        <div className="tw:relative tw:h-full tw:w-[25%] tw:smallscreen:w-[10%] tw:flex tw:flex-col tw:justify-center tw:align-middle">
          <Link className=" tw:absolute tw:left-4 tw:top-0 tw:flex tw:align-middle tw:justify-start" href="/">
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

        {!isMobileWidth ? (
          <>
            <div className="tw:w-screen tw:flex tw:justify-end tw:items-center tw:relative tw:gap-8 tw:tablet:gap-10 tw:laptop:gap-16">
              <button
                className="tw:flex tw:justify-center tw:items-center tw:h-7 tw:w-7"
                onClick={handleBurgerMenu}
              >
                <div className="tw:flex tw:flex-col tw:gap-[0.35rem] tw:smallscreen:gap-[0.7rem] burgerMenuIcon tw:active:scale-105">
                  <div className="tw:h-1 tw:w-9 tw:smallscreen:h-[0.3rem] tw:smallscreen:w-14 tw:rounded tw:bg-linear-to-r tw:from-primary tw:to-primary-dark" />
                  <div className="tw:h-1 tw:w-9 tw:smallscreen:h-[0.3rem] tw:smallscreen:w-14 tw:rounded tw:bg-linear-to-r tw:from-primary tw:to-primary-dark" />
                  <div className="tw:h-1 tw:w-9 tw:smallscreen:h-[0.3rem] tw:smallscreen:w-14 tw:rounded tw:bg-linear-to-r tw:from-primary tw:to-primary-dark" />
                </div>
              </button>
              <div className="tw:flex tw:h-full tw:justify-center tw:items-center tw:relative">
                <NavLoginLogout isOpen={isOpen} setIsOpen={setIsOpen} width="95vw" />
              </div>
            </div>

            <NavGroupMobile showLinks={showLinks} handleBurgerMenu={handleBurgerMenu} />
          </>
        ) : (
          <NavGroup
            showMatchLinks={showMatchLinks}
            setShowMatchLinks={setShowMatchLinks}
            setShowLinks={setShowLinks}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
          />
        )}
      </nav>
    </header>
  );
}
