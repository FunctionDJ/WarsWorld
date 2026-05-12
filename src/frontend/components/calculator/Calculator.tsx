import type { PlayerInMatch } from "shared/types/server-match-state";
import COCalculator from "./COCalculator";

interface Props {
  player: PlayerInMatch;
}

export default function Calculator({ player }: Props) {
  return (
    <>
      <h1>Calculator</h1>
      <div className="tw:grid tw:grid-cols-12 tw:gap-2 tw:bg-bg-primary">
        <div className="tw:col-span-12 tw:flex tw:bg-bg-tertiary tw:align-middle tw:justify-between tw:p-2">
          <p>Attacker</p>
          <button className="btn ">Swap</button>
          <p>Defender</p>
        </div>

        <COCalculator
          gold={player.funds}
          co={player.coId.name}
          capture={10}
          commtower={1}
          coPower={false}
        />
        <COCalculator
          gold={player.funds}
          co={player.coId.name}
          capture={10}
          commtower={1}
          coPower={false}
        />
        <div className="tw:col-span-6 tw:flex-row tw:bg-bg-secondary">
          <div className="tw:flex">UNIT ATTACKER #1</div>

          <div className="tw:flex">UNIT ATTACKER #2</div>
        </div>

        <div className="tw:col-span-6 tw:flex tw:bg-bg-secondary">
          <div className="tw:flex">CounterAttack</div>
          <div className="tw:flex">UNIT Defender</div>
        </div>

        <div className="tw:col-span-6 tw:flex tw:bg-bg-tertiary">TOTAL UNIT</div>

        <div className="tw:col-span-6 tw:flex tw:bg-bg-tertiary">KO Chance</div>

        <div className="tw:col-span-6 tw:flex tw:bg-bg-secondary">TOTAL Gold/Bar made #1</div>

        <div className="tw:col-span-6 tw:flex tw:bg-bg-secondary">TOTAL Gold/Bar made #2</div>
      </div>
    </>
  );
}
