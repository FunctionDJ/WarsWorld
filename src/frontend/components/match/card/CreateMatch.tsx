import type { Player } from "@prisma/client";
import type { SelectOption } from "frontend/components/layout/Select";
import Select from "frontend/components/layout/Select";
import SquareButton from "frontend/components/layout/SquareButton";
import { usePlayers } from "frontend/context/players";
import { trpc } from "frontend/utils/trpc-client";
import { useEffect, useState } from "react";

type Props = {
  currentPlayer: Player | undefined;
  setCurrentPlayer: (player: Player) => void;
};

export default function CreateMatch({ currentPlayer, setCurrentPlayer }: Props) {
  const { ownedPlayers } = usePlayers();
  const utils = trpc.useUtils();

  // Get map data
  const { data: mapQuery, isLoading: isLoadingMapQuery } = trpc.map.getAll.useQuery(undefined, {
    onSuccess: (onSuccessMaps) => {
      setCurrentMapId(onSuccessMaps[0].id);
      setSelectMap({
        label: onSuccessMaps[0].name,
        value: onSuccessMaps[0].id,
      });
    },
  });
  const [currentMapId, setCurrentMapId] = useState<string>();
  const createMatchMutation = trpc.match.create.useMutation({
    onSuccess() {
      void utils.match.invalidate();
    },
  });

  // Select Logic
  const players: SelectOption[] = [];
  ownedPlayers?.forEach((player) => players.push({ label: player.name, value: player.id }));
  const maps: SelectOption[] = [];
  mapQuery?.forEach((map) => maps.push({ label: map.name, value: map.id }));

  const [selectPlayer, setSelectPlayer] = useState<SelectOption | undefined>({
    label: "No player selected",
    value: "",
  });
  const [selectMap, setSelectMap] = useState<SelectOption | undefined>({
    label: "No map selected",
    value: "",
  });

  // Fills the players Select when every time ownedplayers is changed
  useEffect(() => {
    if (currentPlayer) {
      setSelectPlayer({
        label: currentPlayer.name,
        value: currentPlayer.id,
      });
    }
  }, [currentPlayer]);

  const createMatchHandler = async () => {
    if (currentMapId == null || !currentPlayer) {
      return;
    }

    await createMatchMutation.mutateAsync({
      rules: {
        bannedUnitTypes: [],
        captureLimit: 50,
        dayLimit: 50,
        fogOfWar: false,
        fundsPerProperty: 1000,
        unitCapPerPlayer: 50,
        weatherSetting: "clear",
        labUnitTypes: [],
        //TODO: There needs to be more logic regarding how teamMapping will work, specially beyond 2 players
        teamMapping: [0, 1],
      },
      mapId: currentMapId,
      playerId: currentPlayer.id,
    });
  };

  const selectPlayerHandler = (o: SelectOption | undefined) => {
    if (!ownedPlayers) {
      return;
    }

    setSelectPlayer(o);
    const newCurrentPlayer = ownedPlayers.find((p) => p.id === o?.value);

    if (newCurrentPlayer) {
      setCurrentPlayer(newCurrentPlayer);
    }

    void utils.match.invalidate();
  };

  const selectMapHandler = (o: SelectOption | undefined) => {
    setSelectMap(o);
    const newCurrentMap = mapQuery?.find((p) => p.id === o?.value);
    setCurrentMapId(newCurrentMap?.id);
  };

  return (
    <div className="tw:w-full">
      <h1>Match Page</h1>
      <p>
        To create a match, first change Current Player to any other player. Then click on create
        game.
      </p>
      <br />
      {ownedPlayers ? (
        <div className="tw:flex tw:flex-col tw:smallscreen:flex-row tw:justify-center tw:items-center tw:py-2 tw:pb-6">
          <p className="tw:px-0 tw:smallscreen:pr-8">Current Player: </p>
          <Select
            className="tw:relative tw:w-64 tw:my-4 tw:smallscreen:m-0"
            options={players}
            value={selectPlayer}
            onChange={selectPlayerHandler}
          />
        </div>
      ) : (
        <p>Loading Players...</p>
      )}

      <div className="tw:flex tw:flex-col tw:smallscreen:flex-row tw:items-center tw:justify-center tw:gap-5 tw:py-0 tw:smallscreen:py-4">
        {isLoadingMapQuery ? (
          <p>Loading maps...</p>
        ) : (
          <div className="tw:flex tw:flex-col tw:items-center">
            <Select
              className="tw:w-64 tw:smallscreen:w-96"
              options={maps}
              value={selectMap}
              onChange={selectMapHandler}
            />
          </div>
        )}
        <div className="tw:pt-4 tw:smallscreen:py-0 tw:px-2 tw:w-64 tw:h-16 tw:smallscreen:h-12">
          <SquareButton onClick={() => void createMatchHandler()}>Create game</SquareButton>
        </div>
      </div>
    </div>
  );
}
