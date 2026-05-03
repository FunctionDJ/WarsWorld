import type { Dispatch, SetStateAction } from "react";
import NavButton from "./NavButton";
import { NavItem } from "./NavItem";
import NavLoginLogout from "./NavLoginLogout";
import { NavMenuMatches } from "./NavMenuMatches";

interface Props {
  showMatchLinks: boolean;
  setShowMatchLinks: Dispatch<SetStateAction<boolean>>;
  setShowLinks: Dispatch<SetStateAction<boolean>>;
  setIsOpen: (value: boolean, callbackUrl?: string) => Promise<void>;
  isOpen: boolean;
}

const navItemObject = [
  {
    text: "COMPETITION",
    location: "/",
    iconPath: "/img/layout/NeoTank_MSide-0.png",
    iconAlt: "Teal Galaxy Neo Tank",
    flip: true,
  },
  {
    text: "NEWS",
    location: "/news",
    iconPath: "/img/layout/Sub-0.png",
    iconAlt: "Yellow Comet Sub",
    flip: false,
  },
  {
    text: "HOW TO PLAY",
    location: "/howtoplay",
    iconPath: "/img/layout/APC_MSide-0.png",
    iconAlt: "Jade Sun APC",
    flip: true,
  },
  {
    text: "COMMUNITY",
    location: "/",
    iconPath: "/img/layout/Cruiser-0.png",
    iconAlt: "Blue Moon Cruiser",
    flip: false,
  },
];

export function NavGroup({ showMatchLinks, setShowMatchLinks, setIsOpen, isOpen }: Props) {
  return (
    <>
      <div className="tw:flex tw:items-center tw:justify-center tw:gap-10 tw:monitor:gap-16 tw:h-full tw:w-[70vw]">
        <button
          onMouseEnter={() => {
            setShowMatchLinks(true);
          }}
          onMouseLeave={() => {
            setShowMatchLinks(false);
          }}
          className="tw:text-white tw:flex tw:flex-col relative tw:justify-center tw:items-center tw:cursor-pointer matchLobbyToggle tw:h-full"
        >
          <NavButton key="GAME" hasArrow isOpen={showMatchLinks}>
            GAME
          </NavButton>
          <div className="tw:flex tw:justify-center tw:relative tw:w-full ">
            <NavMenuMatches showMatchLinks={showMatchLinks} />
          </div>
        </button>
        {navItemObject.map((item) => (
          <NavItem key={item.text} text={item.text} location={item.location} />
        ))}
      </div>
      <div className="tw:flex tw:h-12 tw:w-[15%] tw:justify-end tw:items-center tw:relative">
        <NavLoginLogout isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </>
  );
}
