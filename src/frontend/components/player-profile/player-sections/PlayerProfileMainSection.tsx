import type { Army } from "shared/schemas/army";
import type { CO } from "shared/schemas/co";

interface Props {
  playerName: string;
  realName: string;
  preferedNation: Army;
  preferedCO: CO;
  description: string;
  lastActivity: string;
  isOnline: boolean;
}

export function PlayerProfileMainSection({
  playerName,
  realName,
  preferedNation,
  preferedCO,
  description,
  lastActivity,
  isOnline,
}: Props) {
  return (
    <section className="tw:h-full tw:bg-black/60 tw:mt-4 tw:rounded-t-xl tw:overflow-hidden">
      <div className={`tw:h-4 tw:w-full @bg-${preferedNation}`} />
      <div className="tw:flex tw:flex-col tw:items-center smallscreen:@items-[normal] tw:smallscreen:flex-row tw:space-y-8 tw:smallscreen:space-y-0 tw:smallscreen:space-x-6 tw:laptop:space-x-12 tw:px-6 tw:laptop:px-12 tw:py-10">
        <div
          className={`tw:min-w-48 tw:max-w-48 tw:min-h-48 tw:max-h-48 @border-${preferedNation} tw:bg-black/50 tw:border-4 tw:text-center tw:overflow-hidden`}
        >
          <img src={`\\img\\CO\\smoothFull\\Awds-${preferedCO}.webp`} alt="grit" />
        </div>
        <div className="tw:min-h-48 tw:flex tw:flex-col">
          <div>
            <div className="tw:flex tw:flex-col tw:space-y-4 tw:laptop:space-y-0 tw:laptop:flex-row tw:justify-between">
              <div>
                <div className="tw:flex tw:space-x-2">
                  <img
                    className="tw:[image-rendering:pixelated] tw:self-center tw:w-8 tw:h-8"
                    src={`\\img\\nations\\${preferedNation}.gif`}
                    alt="blue-moon"
                  />
                  <div className="tw:text-2xl tw:smallscreen:text-4xl tw:font-semibold">{playerName}</div>
                </div>
                <div className="tw:text-gray-500">{realName}</div>
              </div>
              <div className="tw:space-y-2">
                <div className="tw:flex tw:h-6 tw:space-x-2 tw:items-center">
                  <div
                    className={`@h-6 @w-6 @rounded-full ${
                      isOnline ? "tw:bg-green-earth" : "tw:bg-orange-star"
                    }`}
                  ></div>
                  <div className="tw:text-xl">{isOnline ? "Online" : "Offline"}</div>
                </div>
                <div className="tw:text-base tw:text-gray-500">Last Activity: {lastActivity}</div>
              </div>
            </div>
            <div className="tw:pt-6 tw:text-base">{description}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
