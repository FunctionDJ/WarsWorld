import { trpc } from "frontend/utils/trpc-client";
import { useLocalStorage } from "frontend/utils/use-local-storage";
import type { Player } from "generated/browser";
import type { ReactNode } from "react";
import { createContext, use, useMemo } from "react";

type UserContext =
  | {
      ownedPlayers: Player[] | undefined;
      currentPlayerId: string | null;
      setCurrentPlayerId: (value: string) => void;
    }
  | undefined;

const PlayersContext = createContext<UserContext>(undefined);

export const ProvidePlayers = ({ children }: { children: ReactNode }) => {
  const { data } = trpc.user.me.useQuery(undefined, {
    refetchOnReconnect: false, // reduce trpc logging, this data doesn't really need to be refetched automatically
    refetchOnWindowFocus: false,
  });

  const [currentPlayerId, setCurrentPlayerId] = useLocalStorage("currentPlayerId", null);

  const userContextValue: UserContext = useMemo(
    () => ({
      ownedPlayers: data?.ownedPlayers,
      currentPlayerId,
      setCurrentPlayerId,
    }),
    [currentPlayerId, setCurrentPlayerId, data?.ownedPlayers],
  );

  return <PlayersContext value={userContextValue}>{children}</PlayersContext>;
};

export const usePlayers = () => {
  const user = use(PlayersContext);
  const ownedPlayers = user?.ownedPlayers;
  const currentPlayerId = user?.currentPlayerId;
  const setCurrentPlayerId = user?.setCurrentPlayerId;
  const currentPlayer = ownedPlayers?.find((p) => p.id === currentPlayerId);

  const setCurrentPlayer = (player: Player) => {
    if (setCurrentPlayerId) {
      setCurrentPlayerId(player.id);
    }
  };

  const clearLSCurrentPlayer = () => {
    if (setCurrentPlayerId) {
      setCurrentPlayerId("");
    }
  };

  return {
    ownedPlayers,
    currentPlayer,
    setCurrentPlayer,
    clearLSCurrentPlayer,
  };
};
