import { usePlayers } from "frontend/context/players";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FrontendMatch } from "shared/types/component-data";
import type { PlayerInMatch } from "shared/types/server-match-state";
import MatchCardSetup from "./MatchCardSetup";
import MatchPlayer from "./MatchPlayer";

interface matchData {
  match: FrontendMatch;
  inMatch: boolean;
}

export default function MatchCard({ match, inMatch }: matchData) {
  const { currentPlayer } = usePlayers();

  let firstPlayer: PlayerInMatch | undefined;
  let playerIndex: number | undefined;
  let secondPlayer: PlayerInMatch | undefined;

  if (currentPlayer != undefined) {
    match.players.forEach((player, index) => {
      if (player.id == currentPlayer.id) {
        firstPlayer = player;
        playerIndex = index;
      }
    });
  }

  if (firstPlayer === undefined) {
    firstPlayer = match.players[0];
    secondPlayer = match.players[1];
  } else {
    if (playerIndex === 0) {
      secondPlayer = match.players[1];
    } else {
      secondPlayer = match.players[0];
    }
  }

  //this function can change co, army or status (ready/not ready)
  // it is purely visual
  const [currentPlayerOptions, setCurrentPlayerOptions] = useState({
    CO: firstPlayer.coId,
    army: firstPlayer.army,
    ready: firstPlayer.ready,
    slot: firstPlayer.slot,
  });

  const [selectedOptions, setSelectedOptions] = useState({
    selectedArmies: match.players.map((player) => player.army),
    selectedSlots: match.players.map((player) => player.slot),
  });

  useEffect(() => {
    if (firstPlayer) {
      setCurrentPlayerOptions({
        CO: firstPlayer.coId,
        army: firstPlayer.army,
        ready: firstPlayer.ready,
        slot: firstPlayer.slot,
      });
    }
  }, [firstPlayer]);

  return (
    <div className="tw:grid tw:bg-bg-primary tw:relative">
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        <MatchPlayer
          name={firstPlayer.name}
          co={currentPlayerOptions.CO}
          country={currentPlayerOptions.army}
          playerReady={currentPlayerOptions.ready}
          slot={currentPlayerOptions.slot}
        />
        <MatchPlayer
          name={secondPlayer.name}
          co={{ name: secondPlayer.coId.name, version: "AW2" }}
          country={secondPlayer.army}
          flipCO={true}
          playerReady={secondPlayer.ready}
          slot={secondPlayer.slot}
        />
      </div>
      {
        // if we are not in the match AND the match is full, we can't alter setup in anyway or form
        (!inMatch && match.players.length == 2) || match.state != "setup" ? (
          ""
        ) : (
          <MatchCardSetup
            setCurrentPlayerOptions={setCurrentPlayerOptions}
            matchID={match.id}
            // TODO: how can we handle if a player is undefined? for now I put an empty string
            playerID={currentPlayer ? currentPlayer.id : ""}
            inMatch={inMatch}
            readyStatus={currentPlayerOptions.ready ?? false}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            maxNumberOfPlayers={match.map.numberOfPlayers}
          />
        )
      }

      {match.state != "setup" && match.players.length == 2 ? (
        <Link href={`/match2/${match.id}`} className="btnMenu tw:inline-block">
          {" "}
          Enter Match
        </Link>
      ) : !inMatch && match.players.length == 2 ? (
        <div>{"Match hasn't started yet."}</div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
