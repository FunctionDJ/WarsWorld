// pixiEventHandlers.ts
import type { Container } from "pixi.js";
import { Assets } from "pixi.js";
import type { RefObject } from "react";
import { throwIfCantMoveIntoUnit } from "shared/match-logic/events/handlers/move";
import type { MainActionInput } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { WWReadOnly } from "shared/types/ww-readonly";
import type { MatchWrapper } from "shared/wrappers/match/match";
import { isUnitProducingProperty } from "../shared/schemas/tile-utilities";
import type { PlayerInMatchWrapper } from "../shared/wrappers/player/player-in-match";
import type { UnitWrapper } from "../shared/wrappers/unit/unit";
import { displayEnemyRange } from "./display-enemy-range";
import { buildUnitMenu } from "./in-game-menus/build-unit-menu";
import subActionMenu from "./in-game-menus/sub-action-menu";
import { createUnloadMenu } from "./in-game-menus/unload-subaction-menu";
import { createTilesContainer } from "./interactive-tile-functions";
import type { LoadedSpriteSheet } from "./load-spritesheet";
import { renderAttackTiles } from "./render-attack-tiles";
import { renderUnitSprite } from "./render-unit-sprite";
import type { PathNode } from "./show-pathing";
import { getAccessibleNodes, showPath, updatePath } from "./show-pathing";

export const handleClick = async (
  clickPosition: Position,
  match: MatchWrapper,
  player: Readonly<PlayerInMatchWrapper>,
  mapContainer: Container,
  unitContainer: Container,
  interactiveContainer: Container,
  currentUnitClickedRef: RefObject<UnitWrapper | undefined>,
  moveTilesRef: RefObject<Map<Position, PathNode> | undefined>,
  unitRangeShowRef: RefObject<"attack" | "movement" | "vision">,
  pathRef: RefObject<Position[] | undefined>,
  spriteSheets: LoadedSpriteSheet,
  sendAction: (action: MainActionInput) => Promise<void>,
) => {
  //lets load our font
  await Assets.load("/aw2Font.fnt");

  //Check if there is a unit in the tile/position clicked
  const unitClicked = match.getUnit(clickPosition, "dont-throw");

  //Check what tile is in the tile/position clicked
  const tileClicked = match.getTile(clickPosition);

  const isHachiSuperActive =
    player.data.COPowerState === "super-co-power" && player.data.coId.name === "hachi";
  const canTileBuildUnits =
    (tileClicked.type === "city" && isHachiSuperActive) || isUnitProducingProperty(tileClicked);

  //CHECK TO SEE IF WE CLICKED FACILITY
  if (
    !unitClicked &&
    player.owns(tileClicked) &&
    canTileBuildUnits &&
    match.getCurrentTurnPlayer().data.id === player.data.id &&
    currentUnitClickedRef.current === undefined
  ) {
    resetScreen();
    const buildMenu = buildUnitMenu(
      spriteSheets[player.data.army],
      match,
      player,
      clickPosition,
      sendAction,
    );

    interactiveContainer.addChild(buildMenu);
  }

  //there is an currentUnitClickedRef and move tiles (the blue squares)
  // meaning the user has already clicked on a unit
  // so now we can process those movements
  else if (currentUnitClickedRef.current && moveTilesRef.current) {
    const currentUnit = currentUnitClickedRef.current;
    //flag to determine if we clicked on path
    let clickedOnPathFlag = false;

    for (const [pos] of moveTilesRef.current) {
      //we found the path / user clicked on a legal path
      if (clickPosition.isSame(pos)) {
        const unitInTile = match.getUnit(clickPosition, "dont-throw");

        let canUnitMoveIntoOther = false;

        if (unitInTile) {
          try {
            throwIfCantMoveIntoUnit(currentUnit, unitInTile);
            canUnitMoveIntoOther = true;
          } catch {}
        }

        const canMoveToTile =
          unitInTile === undefined || //empty tile
          currentUnit.data.position.isSame(pos) || //same position
          (unitInTile.player.data.slot === currentUnit.player.data.slot && canUnitMoveIntoOther); //join or load

        if (canMoveToTile) {
          // display subaction menu next to unit in new position
          interactiveContainer.addChild(
            subActionMenu(
              match,
              player,
              pos,
              currentUnit,
              currentUnitClickedRef,
              pathRef,
              mapContainer,
              interactiveContainer,
              spriteSheets,
              sendAction,
            ),
          );
          moveTilesRef.current = undefined;
        } else {
          resetScreen();
        }

        clickedOnPathFlag = true;
        break;
      }
    }

    if (!clickedOnPathFlag) {
      //we clicked outside the path
      resetScreen();
    }
  }

  //DID WE CLICK ON A UNIT?
  else if (unitClicked) {
    resetScreen();

    //Do we own said unit and is it our turn?
    if (player.owns(unitClicked) && match.getCurrentTurnPlayer().data.id === player.data.id) {
      //if ready, create path move tiles...
      if (unitClicked.data.isReady) {
        currentUnitClickedRef.current = unitClicked;

        const passablePositions = getAccessibleNodes(match, unitClicked);
        const displayedPassableTiles = createTilesContainer(
          Array.from(passablePositions.keys()),
          "#43d9e4",
          999,
          "highlightedTiles",
        );

        moveTilesRef.current = passablePositions;
        mapContainer.addChild(displayedPassableTiles);

        interactiveContainer.addChild(
          renderAttackTiles(
            interactiveContainer,
            match,
            currentUnitClickedRef,
            spriteSheets,
            pathRef,
            mapContainer,
            sendAction,
          ),
        );
      }
      //if not ready but it's a transport with units and the rules allow to always unload...
      else if (
        unitClicked.isTransport() &&
        unitClicked.data.loadedUnit !== undefined &&
        !player.getVersionProperties().unloadOnlyAfterMove
      ) {
        //Show subaction menu of transport to drop off units
        const unloadMenu = createUnloadMenu(
          match,
          player,
          clickPosition,
          unitClicked,
          currentUnitClickedRef,
          pathRef,
          interactiveContainer,
          spriteSheets,
          sendAction,
        );
        unloadMenu.zIndex = 999;
        interactiveContainer.addChild(unloadMenu);
      }
    }

    //TODO: We clicked on a unit we do not own OR its not our turn. Display unit movement/attack range/vision
    else {
      //show unit path/move/stuff

      mapContainer.addChild(displayEnemyRange(match, unitClicked, unitRangeShowRef));
    }
  }
  //we did not clicked on a facility nor a unit nor a path/move tiles, so we will do nothing other than ensure the state has been resetted clean
  else {
    resetScreen();
  }

  function resetScreen() {
    //removes all temporary sprites (menus, paths, tempunit)
    interactiveContainer.getChildByName("buildMenu")?.destroy();
    interactiveContainer.getChildByName("subActionMenu")?.destroy();
    interactiveContainer.getChildByName("preAttackBox")?.destroy(); //TODO ??
    mapContainer.getChildByName("highlightedTiles")?.destroy();
    mapContainer.getChildByName("pathArrows")?.destroy();

    if (currentUnitClickedRef.current) {
      //lets add the original unit back to its original position only if the original doesnt exist
      if (
        match.getUnit(currentUnitClickedRef.current.data.position, "dont-throw") &&
        !unitContainer.getChildByName(
          `unit-${String(currentUnitClickedRef.current.data.position.data[0])}-${String(currentUnitClickedRef.current.data.position.data[1])}`,
        )
      ) {
        unitContainer.addChild(renderUnitSprite(currentUnitClickedRef.current, spriteSheets));
      }
    }

    moveTilesRef.current = undefined;
    currentUnitClickedRef.current = undefined;
    pathRef.current = undefined;
  }
};

export const handleHover = async (
  hoverPosition: Position,
  match: MatchWrapper,
  player: PlayerInMatchWrapper,
  mapContainer: Container,
  unitContainer: Container,
  interactiveContainer: Container,
  currentUnitClickedRef: RefObject<UnitWrapper | undefined>,
  moveTilesRef: RefObject<Map<Position, PathNode> | undefined>,
  unitRangeShowRef: RefObject<"attack" | "movement" | "vision">,
  pathRef: RefObject<Position[] | undefined>,
  spriteSheets: WWReadOnly<LoadedSpriteSheet>,
  _sendAction: (action: MainActionInput) => Promise<void>, // TODO: unused yet
) => {
  await Assets.load("/aw2Font.fnt");

  const currentUnit = currentUnitClickedRef.current;
  const moveTiles = moveTilesRef.current;

  let hoveredMoveTile = false;

  if (moveTiles !== undefined) {
    for (const [key] of moveTiles) {
      if (hoverPosition.isSame(key)) {
        hoveredMoveTile = true;
      }
    }
  }

  if (currentUnit !== undefined && moveTiles !== undefined && hoveredMoveTile) {
    const newPath = updatePath(
      currentUnit,
      moveTiles,
      pathRef.current ?? [currentUnit.data.position],
      hoverPosition,
    );
    pathRef.current = newPath;
    const arrows = showPath(spriteSheets, newPath);
    mapContainer.getChildByName("pathArrows")?.destroy();
    mapContainer.addChild(arrows);
  }
};
