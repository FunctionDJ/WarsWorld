import { usePlayers } from "frontend/context/players";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import SquareButton from "../layout/SquareButton";
import LoginSignupModal from "../modals/LoginSignupModal";

interface Props {
  setIsOpen: (value: boolean, callbackUrl?: string) => Promise<void>;
  isOpen: boolean;
  width?: string;
}

export default function NavLoginLogout({ isOpen, setIsOpen, width }: Props) {
  const { clearLSCurrentPlayer, currentPlayer } = usePlayers();
  const { data: session } = useSession();

  return (
    <div className="tw:flex tw:justify-center tw:items-center tw:text-2xl tw:w-full tw:h-full">
      {!session && (
        <>
          <div className="tw:w-32">
            <SquareButton
              onClick={() => {
                void setIsOpen(true);
              }}
            >
              LOGIN
            </SquareButton>
          </div>
          <LoginSignupModal isOpen={isOpen} setIsOpen={setIsOpen} width={width ?? "50vw"} />
        </>
      )}
      {session?.user && (
        <div className="tw:flex tw:flex-col tw:w-full tw:align-middle tw:text-center tw:justify-center">
          <Link href={`/players/${currentPlayer?.name}`} className="tw:text-white tw:hover:text-white">
            <p className="@text-md tw:cursor-pointer">{currentPlayer?.name}</p>
          </Link>
          <div
            className="tw:hover:scale-[1.02] tw:text-base tw:smallscreen:text-lg tw:cursor-pointer tw:text-primary-light tw:hover:text-primary"
            onClick={() => {
              clearLSCurrentPlayer();
              void signOut();
            }}
          >
            LOGOUT
          </div>
        </div>
      )}
    </div>
  );
}
