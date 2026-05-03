import type { CO } from "../../../shared/schemas/co";

interface Props {
  CO: CO;
}

export default function COSelect({ CO }: Props) {
  return (
    <div className="tw:w-16 @">
      <img
        className="tw:h-full tw:w-full tw:[image-rendering:pixelated]"
        src={`/img/CO/pixelated/${CO}-small.png`}
        alt=""
      />
    </div>
  );
}
