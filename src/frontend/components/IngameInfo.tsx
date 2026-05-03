import Image from "next/image";

interface Props {
  ingameStatIconPath: string;
  ingameStat: string | number;
}

export function IngameInfo({ ingameStatIconPath, ingameStat }: Props) {
  return (
    <div className="tw:flex tw:justify-between tw:items-center tw:grow tw:bg-gray-800 tw:outline tw:outline-black tw:outline-2 ingameInfo">
      {ingameStatIconPath ? (
        <Image src={ingameStatIconPath} alt="stat icon" />
      ) : (
        <div className="tw:h-3 tw:w-3 tw:bg-white tw:rounded-full" />
      )}
      <div>{ingameStat}</div>
    </div>
  );
}
