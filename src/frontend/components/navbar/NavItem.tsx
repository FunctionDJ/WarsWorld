import Link from "next/link";
import NavButton from "./NavButton";

interface Props {
  text: string;
  location: string;
  handleBurgerMenu?: () => void;
}

export function NavItem({ text, location, handleBurgerMenu }: Props) {
  return (
    <div className="tw:h-full">
      <Link href={location} onClick={handleBurgerMenu}>
        <div className="tw:flex tw:justify-center tw:items-center tw:gap-2 tw:h-full tw:hover:scale-[1.025]">
          <NavButton>{text}</NavButton>
        </div>
      </Link>
    </div>
  );
}
