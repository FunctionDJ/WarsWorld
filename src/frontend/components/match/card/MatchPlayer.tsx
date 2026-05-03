import type { Army } from "shared/schemas/army";
import type { COID } from "shared/schemas/co";

interface matchData {
  name: string;
  co: COID;
  country: Army;
  flipCO?: boolean;
  opponent?: boolean;
  playerReady?: boolean;
  slot?: number;
}

export default function MatchPlayer({
  name,
  co,
  country,
  flipCO,
  opponent,
  playerReady,
  slot,
}: matchData) {
  //TODO: allow for changes in co versions (right now they are all AWDS verions
  //opponent (non-current user) OR an unpicked spot (a greyed out upcoming "opponent")
  if (flipCO !== undefined) {
    return (
      <div className={"tw:truncate tw:text-right"}>
        <div
          style={{
            backgroundImage: `url("/img/CO/pixelated/${co.name}-full.png")`,
          }}
          className={`@h-[200px] [image-rendering:pixelated] @bg-cover 
             ${opponent !== undefined ? "tw:brightness-[0.1]" : ""} 
             ${playerReady === true ? "tw:contrast-[1]" : "tw:contrast-[0.5]"}`}
        ></div>
        <div
          className={`@flex @flex-row-reverse
      ${opponent !== undefined ? "tw:bg-gray-600" : `@bg-${country}`}`}
        >
          <img
            src={
              opponent !== undefined ? `/img/nations/black-hole.gif` : `/img/nations/${country}.gif`
            }
            className="tw:h-7 tw:[image-rendering:pixelated]"
            alt="opponent chosen CO"
          />
          <p className="tw:truncate tw:px-0.5 tw:text-sm">
            {slot !== undefined ? `${name} slot: ${String(slot)}` : name}
          </p>
        </div>
      </div>
    );
  }
  //it is the current player/user
  else {
    return (
      <div className={"tw:truncate tw:text-left"}>
        <div
          style={{
            backgroundImage: `url("/img/CO/pixelated/${co.name}-full.png")`,
          }}
          className={`@h-[200px] [image-rendering:pixelated] @bg-cover @scale-x-[-1] ${
            playerReady === true ? "tw:contrast-[1]" : "tw:contrast-[0.5]"
          }`}
        ></div>
        <div className={`tw:flex @bg-${country}`}>
          <img
            src={`/img/nations/${country}.gif`}
            className="tw:h-7 tw:[image-rendering:pixelated]"
            alt="opponent chosen CO"
          />
          <p className="tw:truncate tw:px-0.5 tw:text-sm">
            {slot !== undefined ? `${name} slot: ${String(slot)}` : name}
          </p>
        </div>
      </div>
    );
  }
}
