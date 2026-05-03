import type { SelectOption } from "../layout/Select";
import Select from "../layout/Select";

const gamemodes = [
  { label: "All", value: 0 },
  { label: "Standard", value: 1 },
  { label: "Fog of War", value: 2 },
  { label: "High Funds", value: 3 },
];
const timeModes = [
  { label: "All", value: 0 },
  { label: "Async", value: 1 },
  { label: "Live", value: 2 },
];

interface Props {
  gamemode: SelectOption | undefined;
  timeMode: SelectOption | undefined;
  setGamemode: React.Dispatch<React.SetStateAction<SelectOption | undefined>>;
  setTimeMode: React.Dispatch<React.SetStateAction<SelectOption | undefined>>;
}

export default function LeaderboardFilters({
  gamemode,
  timeMode,
  setGamemode,
  setTimeMode,
}: Props) {
  return (
    <div className="tw:grid tw:gap-6 tw:grid-cols-2 tw:smallscreen:grid-cols-3 tw:laptop:gap-4 tw:laptop:grid-cols-4 tw:monitor:grid-cols-6 tw:mb-8 tw:smallscreen:mb-12">
      <div className="tw:w-30 tw:cellphone:w-40 tw:tablet:w-56 tw:large_monitor:w-80 tw:space-y-2">
        <label>Gamemode</label>
        <Select
          options={gamemodes}
          value={gamemode}
          onChange={(o) => {
            setGamemode(o);
          }}
        />
      </div>
      <div className="tw:w-30 tw:cellphone:w-40 tw:tablet:w-56 tw:large_monitor:w-80 tw:space-y-2">
        <label>Time mode</label>
        <Select
          options={timeModes}
          value={timeMode}
          onChange={(o) => {
            setTimeMode(o);
          }}
        />
      </div>
    </div>
  );
}
