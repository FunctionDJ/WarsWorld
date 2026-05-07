import { baseTileSize } from "components/client-only/common";
import { BitmapText, Container, Sprite, Texture } from "pixi.js";

export const createSubActionMenuElement = (subActionName: string, numberInList: number) => {
  const unitSize = baseTileSize / 2;
  const yValue = numberInList * unitSize * 2;

  const menuElement = new Container();
  menuElement.eventMode = "static";

  //the grey rectangle bg that each unit has
  const actionBG = new Sprite(Texture.WHITE);
  actionBG.x = 0;
  actionBG.y = yValue;
  //TODO: Standardize these sizes
  actionBG.width = baseTileSize * 2.8;
  actionBG.height = unitSize * 1.35;
  actionBG.eventMode = "static";
  actionBG.tint = "#ffffff";
  actionBG.alpha = 0.5;
  menuElement.addChild(actionBG);

  const actionText = new BitmapText({
    text: subActionName,
    style: {
      fontFamily: "awFont",
      fontSize: 10,
    },
  });
  actionText.y = yValue;
  actionText.x = baseTileSize;
  //trying to line it up nicely wiht the unit icon
  actionText.anchor.set(0, -0.3);
  menuElement.addChild(actionText);

  //lets add a hover effect to the actionBG when you hover over the menu
  menuElement.on("pointerenter", () => {
    actionBG.alpha = 1;
  });

  //when you stop hovering the menu
  menuElement.on("pointerleave", () => {
    actionBG.alpha = 0.5;
  });

  return menuElement;
};
