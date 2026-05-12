import { renderedTileSize } from "components/client-only/common";
import { BitmapText, Container, Sprite, Texture } from "pixi.js";
import { type RefObject } from "react";
import { arrayAtOrThrow } from "shared/array-utilities";
import type { MainActionInput } from "shared/schemas/action";
import { Position } from "../shared/schemas/position";
import type { MatchWrapper } from "../shared/wrappers/match/match";
import type { UnitWrapper } from "../shared/wrappers/unit/unit";
import type { BattleForecast } from "./interactive-tile-functions";
import { getBattleForecast } from "./interactive-tile-functions";
import type { LoadedSpriteSheet } from "./load-spritesheet";
import { renderUnitSprite } from "./render-unit-sprite";
import { getAttackTargetTiles } from "./show-pathing";
import { tileConstructor } from "./sprite-constructor";

export function renderAttackTiles(
  interactiveContainer: Container,
  match: MatchWrapper,
  currentUnitClickedRef: RefObject<UnitWrapper | undefined>,
  spriteSheets: LoadedSpriteSheet,
  pathRef: RefObject<Position[] | undefined>,
  mapContainer: Container,
  sendAction: (action: MainActionInput) => Promise<void>,
  attackingPosition?: Position,
) {
  interactiveContainer.getChildByName("preAttackBox")?.destroy();

  const attackTileContainer = new Container();
  attackTileContainer.name = "preAttackBox";

  if (currentUnitClickedRef.current === undefined) {
    return attackTileContainer;
  }

  const attackTiles = getAttackTargetTiles(match, currentUnitClickedRef.current, attackingPosition);

  attackTiles.forEach((pos) => {
    const attackTile = tileConstructor(pos, "#be1919");
    attackTile.eventMode = "static";

    //lets add a hover effect to the unitBG when you hover over the menu
    attackTile.on("pointerenter", () => {
      attackTileContainer.getChildByName("probabilities")?.destroy();

      const unit1 = currentUnitClickedRef.current;
      const unit2 = match.getUnit(pos, "dont-throw");

      if (unit1 !== undefined && unit2 !== undefined) {
        console.log("PATHREF:", pathRef, pathRef.current);

        const attackingPos =
          pathRef.current !== undefined
            ? arrayAtOrThrow(pathRef.current, "last")
            : unit1.data.position;

        attackTileContainer.addChild(renderProbabilities(unit1, unit2, attackingPos));

        if (unit1.isIndirect()) {
          pathRef.current = undefined;
          mapContainer.getChildByName("pathArrows")?.destroy();
        }
      }
    });

    //when you stop hovering the menu
    attackTile.on("pointerleave", () => {
      attackTileContainer.getChildByName("probabilities")?.destroy();
    });

    attackTile.on("pointerdown", () => {
      if (currentUnitClickedRef.current !== undefined) {
        //unit will not move if path is undefined (= not moving) or if it's indirect
        const path =
          pathRef.current && !currentUnitClickedRef.current.isIndirect()
            ? pathRef.current
            : [currentUnitClickedRef.current.data.position];

        console.log("sending action:", pos, path);
        void sendAction({
          type: "move",
          subAction: {
            type: "attack",
            defenderPosition: pos.toSerializable(),
          },
          path: path.map((p) => p.toSerializable()),
        });

        //The currentUnitClicked has changed (moved, attacked, died), therefore, we delete the previous information as it is not accurate anymore
        //this also helps so when the screen resets, we dont have two copies of a unit
        currentUnitClickedRef.current = undefined;
      }
    });

    attackTileContainer.addChild(attackTile);
  });

  // TODO: at some point maybe refactor all the numbers that are over the place here
  //into somethinc clean and consistent
  function renderProbabilities(
    attacker: UnitWrapper,
    defender: UnitWrapper,
    attackingPos: Position,
  ) {
    const defenderPosition = defender.data.position;
    const probabilitiesContainer = new Container();
    probabilitiesContainer.name = "probabilities";
    probabilitiesContainer.x = ((defenderPosition.data[0] + 2.5) * renderedTileSize) / 2;
    probabilitiesContainer.y = (defenderPosition.data[1] * renderedTileSize) / 2;

    if (attacker === undefined) {
      return probabilitiesContainer;
    }

    const { attackerDamage, defenderDamage }: BattleForecast = getBattleForecast(
      match,
      attacker,
      attackingPos,
      defenderPosition,
    );

    const background = new Sprite(Texture.WHITE);
    background.anchor.set(1, 1); //?
    background.width = renderedTileSize * 2;
    background.height = renderedTileSize * 1.25;
    background.eventMode = "static";
    background.tint = "#eaeaea";
    probabilitiesContainer.addChild(background);

    const attackerText = new BitmapText(
      `${String(attackerDamage.min)}% - ${String(attackerDamage.max)}%`,
      {
        fontFamily: "awFont",
        fontSize: 12,
      },
    );
    attackerText.x = -renderedTileSize * 1.25 - 1;
    attackerText.y = -renderedTileSize * 1.25 + 8;
    probabilitiesContainer.addChild(attackerText);

    const defenderText = new BitmapText(
      `${String(defenderDamage.min)}% - ${String(defenderDamage.max)}%`,
      {
        fontFamily: "awFont",
        fontSize: 12,
      },
    );
    defenderText.x = -renderedTileSize * 2 + 4;
    defenderText.y = -renderedTileSize / 2 + 2;
    probabilitiesContainer.addChild(defenderText);

    const attackerSprite = renderUnitSprite(attacker, spriteSheets, new Position([-4.25, -2.75]));
    probabilitiesContainer.addChild(attackerSprite);

    const defenderSprite = renderUnitSprite(defender, spriteSheets, new Position([-1.75, -1.75]));
    probabilitiesContainer.addChild(defenderSprite);

    return probabilitiesContainer;
  }

  attackTileContainer.zIndex = 999;
  return attackTileContainer;
}
