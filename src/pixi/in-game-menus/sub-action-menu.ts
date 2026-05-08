import { baseTileSize } from "components/client-only/common";
import { Container } from "pixi.js";
import type { RefObject } from "react";
import { arrayAtOrThrow } from "shared/array-utilities";
import {
  AvailableSubActions,
  getAvailableSubActions,
} from "shared/match-logic/events/available-sub-actions";
import { allDirections } from "shared/schemas/direction";
import { Path } from "shared/schemas/path";
import { Position } from "shared/schemas/position";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { UnitWrapper } from "shared/wrappers/unit/unit";
import type { MainAction } from "../../shared/schemas/action";
import type { MatchWrapper } from "../../shared/wrappers/match/match";
import type { PlayerInMatchWrapper } from "../../shared/wrappers/player/player-in-match";
import type { LoadedSpriteSheet } from "../load-spritesheet";
import { renderAttackTiles } from "../render-attack-tiles";
import { tileConstructor } from "../sprite-constructor";
import { createSubActionMenuElement } from "./create-sub-action-menu-element";
import { createInGameMenu } from "./menu-template";
import { createUnloadMenu } from "./unload-subaction-menu";

export default function subActionMenu(
  match: MatchWrapper,
  player: PlayerInMatchWrapper,
  newPosition: Position,
  unit: UnitWrapper,
  currentUnitClickedRef: RefObject<UnitWrapper | undefined>,
  pathRef: RefObject<Position[] | undefined>,
  mapContainer: Container,
  interactiveContainer: Container,
  spriteSheets: LoadedSpriteSheet,
  sendAction: (action: MainAction) => Promise<void>,
) {
  const hasMoved =
    pathRef.current !== undefined &&
    !(
      pathRef.current.length === 0 ||
      (pathRef.current.length === 1 && arrayAtOrThrow(pathRef.current, 0).isSame(newPosition))
    );

  const menuOptions = getAvailableSubActions(match, player, unit, newPosition, hasMoved);

  const unitSize = baseTileSize / 2;

  let iter = 0;

  const menuElements: Container[] = [];

  for (const [name, subAction] of menuOptions) {
    //child container to hold all the text and sprite into one place
    const menuElement = createSubActionMenuElement(AvailableSubActions[name].toUpperCase(), iter);

    menuElement.on("pointerdown", () => {
      switch (name) {
        case AvailableSubActions.Attack: {
          interactiveContainer.addChild(
            renderAttackTiles(
              interactiveContainer,
              match,
              currentUnitClickedRef,
              spriteSheets,
              pathRef,
              mapContainer,
              sendAction,
              //either last path position or asuumes unit didn't move
              pathRef.current ? pathRef.current[pathRef.current.length - 1] : unit.data.position,
            ),
          );
          break;
        }

        case AvailableSubActions.Repair: {
          const repairTilesContainer = new Container();
          repairTilesContainer.label = "repairUnitsBox";

          // TODO maybe we can use unit.getNeighbours() here

          for (const dir of allDirections) {
            if (match.map.isOutOfBounds(unit.data.position.addDirection(dir))) {
              continue;
            }

            const unitToRepair = match.getUnit(unit.data.position.addDirection(dir), "dont-throw");

            if (unitToRepair?.player.data.slot === unit.player.data.slot) {
              const repairTile = tileConstructor(unit.data.position.addDirection(dir), "#43d9e4");
              repairTile.eventMode = "static";

              repairTile.on("pointerdown", () => {
                if (currentUnitClickedRef.current !== undefined) {
                  const path = pathRef.current ?? [currentUnitClickedRef.current.data.position];

                  void sendAction({
                    type: "move",
                    subAction: {
                      type: "repair",
                      direction: dir,
                    },
                    path: new Path(path),
                  });

                  currentUnitClickedRef.current = undefined;
                  repairTilesContainer.destroy();
                }
              });

              repairTilesContainer.addChild(repairTile);
            }
          }

          repairTilesContainer.zIndex = 999;
          interactiveContainer.addChild(repairTilesContainer);
          break;
        }

        case AvailableSubActions.Launch: {
          const clickableLaunchTilesContainer = new Container();
          clickableLaunchTilesContainer.label = "launchMissileClickableBox";

          for (let x = 0; x < match.map.width; x++) {
            for (let y = 0; y < match.map.height; y++) {
              const pos = new Position([x, y]);
              const hoverableTile = tileConstructor(pos, "#000000", 0);
              hoverableTile.eventMode = "static";
              hoverableTile.on("mouseenter", () => {
                //TODO render impact tiles
              });
              hoverableTile.on("pointerdown", () => {
                if (currentUnitClickedRef.current !== undefined) {
                  const path = pathRef.current ?? [currentUnitClickedRef.current.data.position];

                  void sendAction({
                    type: "move",
                    subAction: {
                      type: "launchMissile",
                      targetPosition: pos,
                    },
                    path: new Path(path),
                  });

                  currentUnitClickedRef.current = undefined;
                }
              });

              clickableLaunchTilesContainer.addChild(hoverableTile);
            }
          }

          clickableLaunchTilesContainer.zIndex = 999;
          interactiveContainer.addChild(clickableLaunchTilesContainer);
          break;
        }

        case AvailableSubActions.Unload: {
          const unloadMenu = createUnloadMenu(
            match,
            player,
            newPosition,
            unit,
            currentUnitClickedRef,
            pathRef,
            interactiveContainer,
            spriteSheets,
            sendAction,
          );

          unloadMenu.zIndex = 999;
          interactiveContainer.addChild(unloadMenu);
          break;
        }

        case AvailableSubActions.Delete: {
          void sendAction({
            type: "delete",
            position: newPosition,
          });

          currentUnitClickedRef.current = undefined;
          break;
        }

        default: {
          const definedSubAction = throwIfUndefined(subAction);

          void sendAction({
            type: "move",
            subAction: definedSubAction,
            path: new Path(pathRef.current ?? [newPosition]),
          });

          //The currentUnitClicked has changed (moved, attacked, died), therefore, we delete the previous information as it is not accurate anymore
          //this also helps so when the screen resets, we dont have two copies of a unit
          currentUnitClickedRef.current = undefined;
          break;
        }
      }

      //as soon a selection is done, destroy/erase the menu
      menuElement.parent?.destroy();
    });

    iter++;
    menuElements.push(menuElement);
  }

  const menuContainer = createInGameMenu(match, newPosition, iter * unitSize * 2, 3, menuElements);
  menuContainer.label = "subActionMenu";
  return menuContainer;
}
