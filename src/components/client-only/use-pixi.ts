"use client";
import { trpc } from "frontend/utils/trpc-client";
import type { Container } from "pixi.js";
import { Application } from "pixi.js";
import type { LoadedSpriteSheet } from "pixi/load-spritesheet";
import { setupApp } from "pixi/setup-app";
import { useEffect, useRef } from "react";
import type { MainActionInput } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { MatchWrapper } from "shared/wrappers/match";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";
import { handleClick, handleHover } from "../../pixi/handle-click";
import type { PathNode } from "../../pixi/show-pathing";
import type { Unit } from "../../shared/wrappers/unit";
import { renderedTileSize, renderMultiplier } from "./common";

export const usePixi = (
  match: MatchWrapper,
  spriteSheets: LoadedSpriteSheet,
  player: PlayerInMatchWrapper,
): {
  pixiCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  mapContainerRef: React.RefObject<Container | undefined>;
} => {
  //containers holding pixi elements
  const pixiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapContainerRef = useRef<Container | undefined>(undefined);
  const unitContainerRef = useRef<Container | undefined>(undefined);
  const interactiveContainerRef = useRef<Container | undefined>(undefined);

  // the unit we've clicked (the one that will be seeing sub action menu), we keep it here to reference it later on
  const currentUnitClickedRef = useRef<Unit | undefined>(undefined);

  // when user clicks an unit, we need a variable to determine if we show them unit's movement range, attack range or vision (for fog)
  const unitRangeShowRef = useRef<"attack" | "movement" | "vision">("movement");

  // [cringe-code] To some extent, these three all store the same type of information (positions), however, they store it at different times...
  const moveTilesRef = useRef<Map<Position, PathNode> | undefined>(undefined);

  const pathRef = useRef<Position[] | undefined>(undefined);

  const actionMutation = trpc.action.send.useMutation();

  useEffect(() => {
    const app = new Application();

    void app
      .init({
        view: pixiCanvasRef.current ?? undefined,
        autoDensity: true,
        resolution: window.devicePixelRatio,
        backgroundColor: "#000b2c",
        width: match.map.width * renderedTileSize + renderedTileSize,
        height: match.map.height * renderedTileSize + renderedTileSize,
      })
      .then(() => {
        const sendAction = async (action: MainActionInput): Promise<void> => {
          await actionMutation.mutateAsync({
            playerId: player.data.id,
            matchId: match.id,
            ...action,
          });
        };

        const onTileClick = async (pos: Position): Promise<void> => {
          if (
            mapContainerRef.current !== undefined &&
            unitContainerRef.current !== undefined &&
            interactiveContainerRef.current !== undefined
          ) {
            await handleClick(
              pos,
              match,
              player,
              mapContainerRef.current,
              unitContainerRef.current,
              interactiveContainerRef.current,
              currentUnitClickedRef,
              moveTilesRef,
              unitRangeShowRef,
              pathRef,
              spriteSheets,
              sendAction,
            );
          }
        };

        const onTileHover = async (pos: Position): Promise<void> => {
          if (
            mapContainerRef.current !== undefined &&
            unitContainerRef.current !== undefined &&
            interactiveContainerRef.current !== undefined
          ) {
            await handleHover(
              pos,
              match,
              player,
              mapContainerRef.current,
              unitContainerRef.current,
              interactiveContainerRef.current,
              currentUnitClickedRef,
              moveTilesRef,
              unitRangeShowRef,
              pathRef,
              spriteSheets,
              sendAction,
            );
          }
        };

        const { mapContainer, unitContainer, interactiveContainer } = setupApp(
          app,
          match,
          renderMultiplier,
          spriteSheets,
          onTileClick,
          onTileHover,
        );

        mapContainerRef.current = mapContainer;
        unitContainerRef.current = unitContainer;
        interactiveContainerRef.current = interactiveContainer;
        mapContainerRef.current.eventMode = "static";
      });

    return (): void => {
      app.stop();
    };
  }, [actionMutation, match, player, spriteSheets]);

  return {
    pixiCanvasRef,
    mapContainerRef,
  };
};
