import { NavItem } from "./NavItem";

type Props = {
  showMatchLinks: boolean;
  handleBurgerMenu?: () => void;
};

const navItemObject = [
  { text: "YOUR GAMES", location: "/your-matches" },
  { text: "CURRENT GAMES", location: "/your-matches#currentGames" },
  { text: "COMPLETED GAMES", location: "/your-matches#completedGames" },
];

export function NavMenuMatches({ showMatchLinks, handleBurgerMenu }: Props) {
  return (
    <ul
      className={`@absolute @m-0 @p-0 @list-none @overflow-y-hidden @shadow-black @shadow-lg @w-56 monitor:@w-[18vw] @rounded @top-[calc(100%_+_1em)] laptop:@top-[calc(100%_+_0.2em)]
      @bg-gradient-to-r @from-bg-primary @from-30% @to-bg-secondary @z-50 @duration-[750ms]
          ${showMatchLinks ? "tw:max-h-96" : "tw:max-h-0"}`}
    >
      {navItemObject.map((option) => (
        <li
          key={option.text}
          className="tw:py-3 tw:px-4 tw:large_monitor:py-4 tw:cursor-pointer tw:border-primary-dark tw:border-b tw:h-full"
        >
          <NavItem
            text={option.text}
            location={option.location}
            handleBurgerMenu={handleBurgerMenu}
          />
        </li>
      ))}
    </ul>
  );
}
