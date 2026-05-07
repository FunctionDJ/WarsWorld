"use client";
import { trpc } from "frontend/utils/trpc-client";
import type { LoadedSpriteSheet } from "pixi/load-spritesheet";
import { useEffect, useState } from "react";
import { applyAbilityEvent } from "shared/match-logic/events/handlers/ability";
import { applyEmittableAttackEvent } from "shared/match-logic/events/handlers/attack/apply-attack-event";
import { applyBuildEvent } from "shared/match-logic/events/handlers/build";
import { applyMoveEvent } from "shared/match-logic/events/handlers/move";
import { applyPassTurnEvent } from "shared/match-logic/events/handlers/pass-turn";
import type { EmittableAttackEvent, EmittableMoveEvent } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { PlayerInMatchWrapper } from "shared/wrappers/player/player-in-match";
import type { FrontendUnit } from "../../frontend/components/match/frontend-unit";
import type { ChangeableTileWithSprite } from "../../frontend/components/match/types";
import { usePixi } from "./use-pixi";

interface Props {
  match: MatchWrapper<ChangeableTileWithSprite, FrontendUnit>;
  player: PlayerInMatchWrapper;
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
    //Adding all dependencies here causes an infinite loop
    /* eslint-disable */ [],
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
            const pw = event.path;

            if (event.path.len() === 0 || !match.getUnit(pw.at(0))) {
              break;
            }

            applyMoveEvent(match, event as EmittableMoveEvent);

            switch (event.subEvent.type) {
              case "attack": {
                applyEmittableAttackEvent(match, event.subEvent as EmittableAttackEvent);
                break;
              }
              case "ability": {
                applyAbilityEvent(match, event.subEvent, pw.at("last"));
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
        className="btn tw:select-none"
        onClick={() => {
          passTurnMutation
            .mutateAsync({
              type: "passTurn",
              playerId: player.data.id,
              matchId: match.id,
            })
            .catch((err) => {
              console.log(err);
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
