import { baseTileSize } from "components/client-only/common";
import { Container } from "pixi.js";
import type { RefObject } from "react";
import { arr } from "shared/arr";
import {
  AvailableSubActions,
  getAvailableSubActions,
} from "shared/match-logic/events/available-sub-actions";
import { allDirections } from "shared/schemas/direction";
import { Path } from "shared/schemas/path";
import { Position } from "shared/schemas/position";
import type { UnitWrapper } from "shared/wrappers/unit";
import type { MainAction } from "../../shared/schemas/action";
import type { MatchWrapper } from "../../shared/wrappers/match";
import type { PlayerInMatchWrapper } from "../../shared/wrappers/player-in-match";
import type { LoadedSpriteSheet } from "../load-spritesheet";
import { renderAttackTiles } from "../renderAttackTiles";
import { tileConstructor } from "../sprite-constructor";
import { createSubActionMenuElement } from "./createSubActionMenuElement";
import { createInGameMenu } from "./menuTemplate";
import { createUnloadMenu } from "./unloadSubactionMenu";

export default function subActionMenu(
  match: MatchWrapper,
  player: PlayerInMatchWrapper,
  newPosition: Position,
  unit: UnitWrapper,
  currentUnitClickedRef: RefObject<UnitWrapper | null>,
  pathRef: RefObject<Position[] | null>,
  mapContainer: Container,
  interactiveContainer: Container,
  spriteSheets: LoadedSpriteSheet,
  sendAction: (action: MainAction) => Promise<void>,
) {
  const hasMoved =
    pathRef.current !== null &&
    !(
      pathRef.current.length === 0 ||
      (pathRef.current.length === 1 && arr(pathRef.current, 0).isSame(newPosition))
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

          for (const dir of allDirections) {
            if (match.map.isOutOfBounds(unit.data.position.addDirection(dir))) {
              continue;
            }

            const unitToRepair = match.getUnit(unit.data.position.addDirection(dir));

            if (unitToRepair?.player.data.slot === unit.player.data.slot) {
              const repairTile = tileConstructor(unit.data.position.addDirection(dir), "#43d9e4");
              repairTile.eventMode = "static";

              repairTile.on("pointerdown", () => {
                if (currentUnitClickedRef.current !== null) {
                  const path = pathRef.current ?? [currentUnitClickedRef.current.data.position];

                  void sendAction({
                    type: "move",
                    subAction: {
                      type: "repair",
                      direction: dir,
                    },
                    path: new Path(path),
                  });

                  currentUnitClickedRef.current = null;
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
                if (currentUnitClickedRef.current !== null) {
                  const path = pathRef.current ?? [currentUnitClickedRef.current.data.position];

                  void sendAction({
                    type: "move",
                    subAction: {
                      type: "launchMissile",
                      targetPosition: pos,
                    },
                    path: new Path(path),
                  });

                  currentUnitClickedRef.current = null;
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

          currentUnitClickedRef.current = null;
          break;
        }

        default: {
          if (subAction === undefined) {
            throw new Error(
              "Received undefined subAction from menu option that doesn't require further interaction: " +
                String(name),
            );
          }

          void sendAction({
            type: "move",
            subAction: subAction,
            path: new Path(pathRef.current ?? [newPosition]),
          });

          //The currentUnitClicked has changed (moved, attacked, died), therefore, we delete the previous information as it is not accurate anymore
          //this also helps so when the screen resets, we dont have two copies of a unit
          currentUnitClickedRef.current = null;
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
