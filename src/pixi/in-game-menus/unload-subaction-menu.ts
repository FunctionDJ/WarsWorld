import { baseTileSize } from "components/client-only/common";
import { Container } from "pixi.js";
import type { RefObject } from "react";
import { arrayAtOrThrow } from "shared/array-utilities";
import { getUnloadablePositions } from "shared/match-logic/events/handlers/unload/check-unload-tiles";
import { type Position } from "shared/schemas/position";
import type { Unit } from "shared/wrappers/unit";
import type { MainActionInput } from "../../shared/schemas/action";
import type { MatchWrapper } from "../../shared/wrappers/match";
import type { PlayerInMatchWrapper } from "../../shared/wrappers/player-in-match";
import type { LoadedSpriteSheet } from "../load-spritesheet";
import { tileConstructor } from "../sprite-constructor";
import { createMenuElementsForUnits } from "./build-unit-menu";
import { createSubActionMenuElement } from "./create-sub-action-menu-element";
import { createInGameMenu } from "./menu-template";

export const createUnloadMenu = (
  match: MatchWrapper,
  player: PlayerInMatchWrapper,
  newPosition: Position,
  unit: Unit,
  currentUnitClickedRef: RefObject<Unit | undefined>,
  pathRef: RefObject<Position[] | undefined>,
  interactiveContainer: Container,
  spriteSheets: LoadedSpriteSheet,
  sendAction: (action: MainActionInput) => Promise<void>,
  /**
   * Function can be called as 2nd unload. In this case, this variable will have the info of the first unload
   */
  firstUnloadInfo?: { unloadedPosition: Position; isFirstUnit: boolean },
) => {
  if (
    !("loadedUnits" in unit.data) ||
    unit.data.loadedUnits.every((loadedUnit) => loadedUnit === undefined)
  ) {
    throw new Error("Asked to create unlaod menu for unit without loaded units");
  }

  let unloadPositions1: readonly Position[] | undefined = undefined;
  let unloadPositions2: readonly Position[] | undefined = undefined;
  let menuInfo1 = undefined;
  let menuInfo2 = undefined;
  const infosForMenu = [];

  if (!firstUnloadInfo?.isFirstUnit && unit.data.loadedUnits[0] !== undefined) {
    const loadedUnit = unit.getLoadedUnit(1);
    unloadPositions1 = getUnloadablePositions(unit, loadedUnit, newPosition);

    if (firstUnloadInfo !== undefined) {
      unloadPositions1.filter((pos) => {
        return !pos.isSame(firstUnloadInfo.unloadedPosition);
      });
    }

    menuInfo1 = {
      unitType: unit.data.loadedUnits[0].type,
      selectable: unloadPositions1.length > 0,
      num: Math.ceil(
        (unit.data.loadedUnits[0].hp === "sonja-hidden" ? 100 : unit.data.loadedUnits[0].hp) / 10,
      ),
    };

    infosForMenu.push(menuInfo1);
  }

  if (
    "loadedUnit2" in unit.data &&
    unit.data.loadedUnits[1] !== undefined &&
    (firstUnloadInfo === undefined || firstUnloadInfo.isFirstUnit)
  ) {
    unloadPositions2 = getUnloadablePositions(unit, unit.getLoadedUnit(2), newPosition);

    if (firstUnloadInfo !== undefined) {
      unloadPositions2.filter((pos) => {
        return !pos.isSame(firstUnloadInfo.unloadedPosition);
      });
    }

    menuInfo2 = {
      unitType: unit.data.loadedUnits[1].type,
      selectable: unloadPositions2.length > 0,
      num: Math.ceil(
        (unit.data.loadedUnits[1].hp === "sonja-hidden" ? 100 : unit.data.loadedUnits[1].hp) / 10,
      ), //visual hp
    };

    infosForMenu.push(menuInfo2);
  }

  const { menuElements, yValue } = createMenuElementsForUnits(
    spriteSheets[player.data.army],
    infosForMenu,
  );

  const clickedUnloadPosition = (
    unloadPos: Position,
    isFirstUnit: boolean,
    canOtherUnitBeUnloaded: boolean,
  ) => {
    if (canOtherUnitBeUnloaded) {
      //there were no other options (or the only unloadable position for the other unit was this one), commit the unload action
      if (currentUnitClickedRef.current !== undefined) {
        const path = pathRef.current ?? [currentUnitClickedRef.current.data.position];

        const unloads = [
          { isSecondUnit: !isFirstUnit, direction: newPosition.getDirectionTo(unloadPos) },
        ];

        if (firstUnloadInfo !== undefined) {
          unloads.push({
            isSecondUnit: !firstUnloadInfo.isFirstUnit,
            direction: newPosition.getDirectionTo(firstUnloadInfo.unloadedPosition),
          });
        }

        void sendAction({
          type: "move",
          subAction: {
            type: "unloadWait",
            unloads: unloads,
          },
          path: path.map((p) => p.toSerializable()),
        });

        currentUnitClickedRef.current = undefined;
      }
    } else {
      const unitSize = baseTileSize / 2;

      const unload2Option = createSubActionMenuElement("UNLOAD", 0);
      unload2Option.on("pointerdown", () => {
        const step2Menu = createUnloadMenu(
          match,
          player,
          newPosition,
          unit,
          currentUnitClickedRef,
          pathRef,
          interactiveContainer,
          spriteSheets,
          sendAction,
          { unloadedPosition: unloadPos, isFirstUnit: isFirstUnit },
        );

        step2Menu.zIndex = 999;
        interactiveContainer.addChild(step2Menu);
        unload2Option.parent?.destroy();
      });

      const waitOption = createSubActionMenuElement("WAIT", 1);
      waitOption.on("pointerdown", () => {
        void sendAction({
          type: "move",
          subAction: {
            type: "unloadWait",
            unloads: [
              { isSecondUnit: !isFirstUnit, direction: newPosition.getDirectionTo(unloadPos) },
            ],
          },
          path: pathRef.current
            ? pathRef.current.map((p) => p.toSerializable())
            : [newPosition.toSerializable()],
        });

        currentUnitClickedRef.current = undefined;
        waitOption.parent?.destroy();
      });

      const unload2OrWaitMenu = createInGameMenu(match, newPosition, 2 * unitSize * 2, 3, [
        unload2Option,
        waitOption,
      ]);
      unload2OrWaitMenu.label = "unloadStep2ActionMenu";
      interactiveContainer.addChild(unload2OrWaitMenu);
    }
  };

  const attachUnloadPositionHandler = (unloadPositions: readonly Position[], index: number) => {
    arrayAtOrThrow(menuElements, index).on("pointerdown", () => {
      const unloadTilesContainer = new Container();
      unloadTilesContainer.label = "unloadUnitsBox";

      for (const unloadPos of unloadPositions) {
        const unloadTile = tileConstructor(unloadPos, "#43d9e4");
        unloadTile.eventMode = "static";

        unloadTile.on("pointerdown", () => {
          const canOtherUnitBeUnloaded =
            player.getVersionProperties().unloadOnlyAfterMove &&
            (infosForMenu.length === 1 ||
              unloadPositions?.every((pos) => {
                return pos.isSame(unloadPos);
              }) === true);

          unloadTilesContainer.visible = false;
          clickedUnloadPosition(unloadPos, true, canOtherUnitBeUnloaded);
          unloadTilesContainer.destroy();
        });

        unloadTilesContainer.addChild(unloadTile);
      }

      unloadTilesContainer.zIndex = 999;
      interactiveContainer.addChild(unloadTilesContainer);
      //as soon a selection is done, destroy/erase the menu
      menuElements[0]?.parent?.destroy();
    });
  };

  if (unloadPositions1 !== undefined && unloadPositions1.length > 0) {
    attachUnloadPositionHandler(unloadPositions1, 0);
  }

  if (unloadPositions2 !== undefined && unloadPositions2.length > 0) {
    const meIndex = unloadPositions1 === undefined ? 0 : 1; //if unit1 wasnt unloadable, the index will be 0
    attachUnloadPositionHandler(unloadPositions2, meIndex);
  }

  const unloadUnitSelectMenu = createInGameMenu(match, newPosition, yValue, 6, menuElements);
  unloadUnitSelectMenu.label = "unloadUnitSelect";
  return unloadUnitSelectMenu;
};
