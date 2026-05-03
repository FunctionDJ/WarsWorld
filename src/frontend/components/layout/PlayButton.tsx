interface Props {
  onClick?: React.MouseEventHandler;
  children: React.ReactNode;
}

export default function PlayButton({ onClick, children }: Props) {
  return (
    <div className="filter-shadow-wrap tw:overflow-visible" onClick={onClick}>
      <button
        className="octagon-box tw:relative tw:bg-blue-moon tw:font-black tw:w-auto tw:h-auto tw:hover:scale-[1.01] tw:duration-100 tw:shadow-black tw:shadow-lg"
        onClick={onClick}
      >
        <div className="tw:bg-blue-moon tw:flex tw:items-center tw:py-3 tw:smallscreen:py-6 tw:monitor:py-6 tw:px-4 tw:smallscreen:px-8 tw:monitor:px-12 tw:space-x-4">
          <svg
            className="tw:scale-150 tw:fill-white tw:rotate-20 tw:w-10 tw:cellphone:w-12 tw:smallscreen:w-20 tw:monitor:w-26 tw:h-10 tw:cellphone:h-12 tw:smallscreen:h-16 tw:monitor:h-22"
            width="200px"
            height="200px"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            data-name="Layer 1"
          >
            <path d="M21,11H19.93A8,8,0,0,0,13,4.07V3a1,1,0,0,0-2,0V4.07A8,8,0,0,0,4.07,11H3a1,1,0,0,0,0,2H4.07A8,8,0,0,0,11,19.93V21a1,1,0,0,0,2,0V19.93A8,8,0,0,0,19.93,13H21a1,1,0,0,0,0-2Zm-9,7a6,6,0,1,1,6-6A6,6,0,0,1,12,18Zm0-9a3,3,0,1,0,3,3A3,3,0,0,0,12,9Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,12,13Z" />
          </svg>
          <div className="tw:text-white @font-russoOne tw:text-3xl tw:cellphone:text-4xl tw:laptop:text-6xl tw:monitor:text-8xl tw:pl-6 tw:smallscreen:pl-8">
            {children}
          </div>
        </div>
      </button>
    </div>
  );
}
