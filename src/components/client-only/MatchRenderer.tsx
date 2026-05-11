"use client";
import { trpc } from "frontend/utils/trpc-client";
import type { LoadedSpriteSheet } from "pixi/load-spritesheet";
import { useEffect, useState } from "react";
import { applyAbilityEvent } from "shared/match-logic/events/handlers/ability";
import { applyEmittableAttackEvent } from "shared/match-logic/events/handlers/attack/apply-attack-event";
import { applyBuildEvent } from "shared/match-logic/events/handlers/build";
import { applyMoveEvent } from "shared/match-logic/events/handlers/move";
import { applyPassTurnEvent } from "shared/match-logic/events/handlers/pass-turn";
import type { MutableMatch } from "shared/wrappers/match/mutable-match";
import type { MutablePlayerInMatch } from "shared/wrappers/player/mutable-player-in-match";
import { usePixi } from "./use-pixi";

interface Props {
  match: MutableMatch;
  player: MutablePlayerInMatch;
  spriteSheets: LoadedSpriteSheet;
  turn: boolean;
  setTurn: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MatchRenderer({ match, player, spriteSheets, turn, setTurn }: Props) {
  const [eventTrigger, setEventTrigger] = useState(0);
  useEffect(
    () => {
      const isPlayerTurn = match.getCurrentTurnPlayer().data.id === player.data.id;
      setTurn(isPlayerTurn);
    },
    // TODO Adding all dependencies here causes an infinite loop
    [match, player.data.id, setTurn],
  );

  const { pixiCanvasRef } = usePixi(match, spriteSheets, player);

  const passTurnMutation = trpc.action.send.useMutation();

  trpc.action.onEvent.useSubscription(
    {
      playerId: player.data.id,
      matchId: match.id,
    },
    {
      onData(event) {
        switch (event.type) {
          case "build": {
            applyBuildEvent(match, event);

            break;
          }
          case "passTurn": {
            applyPassTurnEvent(match, event);
            setTurn(match.getCurrentTurnPlayer().data.id === player.data.id);
            break;
          }
          case "move": {
            if (event.path.len() === 0 || !match.getUnit(event.path.at(0), "dont-throw")) {
              break;
            }

            applyMoveEvent(match, event);

            switch (event.subEvent.type) {
              case "attack": {
                applyEmittableAttackEvent(match, event.subEvent);
                break;
              }
              case "ability": {
                applyAbilityEvent(match, event.subEvent, event.path.at("last"));
                break;
              }
            }

            break;
          }
        }

        setEventTrigger(eventTrigger + 1);
      },
    },
  );

  return (
    <>
      <p>Your Funds: {player.data.funds}</p>
      <button
        type="button"
        className="btn tw:select-none"
        onClick={() => {
          passTurnMutation
            .mutateAsync({
              type: "passTurn",
              playerId: player.data.id,
              matchId: match.id,
            })
            .catch((error: unknown) => {
              console.log(error);
            });
        }}
      >
        {turn ? "Pass Turn" : "Not your Turn"}
      </button>
      <canvas
        className="tw:inline"
        style={{
          imageRendering: "pixelated",
        }}
        ref={pixiCanvasRef}
      ></canvas>
    </>
  );
}
