import type { CO } from "../../../shared/schemas/co";
import COSelect from "./COSelect";
import IconText from "./IconText";

interface Props {
  co: CO;
  commtower: number;
  gold: number;
  capture: number;
  coPower: boolean;
}

export default function COCalculator({ co, capture, commtower, gold }: Props) {
  return (
    <div className="tw:col-span-6 tw:flex tw:bg-bg-tertiary tw:justify-between tw:align-middle tw:items-center ">
      <div className="tw:flex">
        <COSelect CO={co} />
        <IconText icon={"redstar"} />
        <IconText icon={"bluestar"} />
      </div>

      <IconText icon={"commtower"} text={commtower} />
      <IconText icon={"coin"} text={gold} />
      <IconText icon={"capture"} text={capture} />
    </div>
  );
}
