import { baseTileSize } from "components/client-only/common";
import { Container, Sprite } from "pixi.js";
import { arr } from "shared/arr";
import {
  createPipeSeamUnitEquivalent,
  getBaseDamage,
} from "shared/match-logic/game-constants/base-damage";
import { Position } from "shared/schemas/position";
import type { MapWrapper } from "shared/wrappers/map";
import type { MatchWrapper } from "shared/wrappers/match";
import { DispatchableError } from "../shared/DispatchedError";
import type { UnitWrapper } from "../shared/wrappers/unit";
import type { LoadedSpriteSheet } from "./load-spritesheet";
export interface PathNode {
  //saves distance from origin and parent (to retrieve the shortest path)
  pos: Position;
  dist: number;
  parent: Position | null;
}

const makeVisitedMatrix = (map: MapWrapper) =>
  Array.from({ length: map.width })
    .fill(false)
    .map(() => Array.from<boolean>({ length: map.height }).fill(false));

export const getAccessibleNodes = (
  //TODO: save result of function? _ (Sturm d2d?)
  match: MatchWrapper,
  unit: UnitWrapper,
): Map<Position, PathNode> => {
  const ownerUnitPlayer = match.getPlayerBySlot(unit.data.playerSlot);

  if (ownerUnitPlayer === undefined) {
    throw new DispatchableError("This unit doesn't have an owner");
  }

  const accessibleTiles = new Map<Position, PathNode>(); //return variable

  //queues[a] has current queued nodes with distance a from origin (technically a "stack", not a queue, but the result doesn't change)
  const queues: PathNode[][] = Array.from({ length: unit.getMovementPoints() }, () => []);

  const firstQueue = queues[0];

  if (firstQueue === undefined) {
    throw new DispatchableError("Unit has negative movement points, which is not possible");
  }

  firstQueue.push({ pos: unit.data.position, dist: 0, parent: null }); //queues[0] has the origin node, initially

  const visited = makeVisitedMatrix(match.map);

  for (const unit of ownerUnitPlayer.team.getEnemyUnits()) {
    //enemy tiles are impassible
    arr(visited, unit.data.position.data[0])[unit.data.position.data[1]] = true;
  }

  let currentDist = 0; //will check from closest to furthest, to find the shortest path

  while (currentDist < queues.length) {
    if (arr(queues, currentDist).length === 0) {
      //increase currentDist if all nodes within that distance have been processed
      ++currentDist;
      continue;
    }

    const currNode = arr(queues, currentDist).pop();
    const currPos = currNode?.pos;

    if (
      currNode === undefined ||
      currPos === undefined ||
      arr(visited, currPos.data[0])[currPos.data[1]]
    ) {
      continue;
    }

    //update variables to mark as visited and add to result
    arr(visited, currPos.data[0])[currPos.data[1]] = true;
    accessibleTiles.set(currPos, currNode);

    for (const pos of currPos.getNeighbours()) {
      if (match.map.isOutOfBounds(pos)) {
        continue;
      }

      const movementCost = unit.getMovementCost(pos);

      if (movementCost === null) {
        continue;
      } //skip if unit can't move there

      const nodeDist = currNode.dist + movementCost;

      if (nodeDist <= unit.getMovementPoints()) {
        arr(queues, nodeDist - 1).push({
          pos: pos,
          dist: nodeDist,
          parent: currPos,
        }); //add new node with new distance and parent
      }
    }
  }

  return accessibleTiles;
};

export const getAttackableTiles = (
  match: MatchWrapper,
  unit: UnitWrapper,
  fromPosition?: Position,
  accessibleNodes?: Map<Position, PathNode>,
): Position[] => {
  const attackPositions: Position[] = [];
  const sourcePosition = fromPosition ?? unit.data.position;

  const attackRange = unit.getAttackRange();

  if (unit.isIndirect() && attackRange !== undefined) {
    // Ranged unit (2nd condition is for typescript)

    for (let x = 0; x < match.map.width; x++) {
      for (let y = 0; y < match.map.height; y++) {
        const pos = new Position([x, y]);
        const distance = pos.getDistance(sourcePosition);

        if (distance <= attackRange.maxRange && distance >= attackRange.minRange) {
          attackPositions.push(pos);
        }
      }
    }
  } else {
    // Melee unit
    accessibleNodes ??= fromPosition
      ? new Map([[fromPosition, { pos: fromPosition, dist: 0, parent: null }]]) // Create a minimal node if specific position given
      : getAccessibleNodes(match, unit);

    const visited = makeVisitedMatrix(match.map);

    for (const [pos] of accessibleNodes.entries()) {
      if (match.getUnit(pos) !== undefined && !pos.isSame(unit.data.position)) {
        //another unit occupies this spot so we can't move to it to attack
        continue;
      }

      for (const adjPos of pos.getNeighbours()) {
        if (!match.map.isOutOfBounds(adjPos)) {
          if (!arr(visited, adjPos.data[0])[adjPos.data[1]]) {
            attackPositions.push(adjPos);
            arr(visited, adjPos.data[0])[adjPos.data[1]] = true;
          }
        }
      }
    }
  }

  return attackPositions;
};

export const getAttackTargetTiles = (
  match: MatchWrapper,
  unit: UnitWrapper,
  fromPosition?: Position,
  attackableTiles?: Position[],
) => {
  const attackTargetPositions: Position[] = [];
  attackableTiles ??= getAttackableTiles(match, unit, fromPosition);

  const canAttackPipeseams =
    getBaseDamage(unit, createPipeSeamUnitEquivalent(match, unit)) !== null;

  for (const position of attackableTiles) {
    const enemy = match.getUnit(position);

    if (enemy === undefined) {
      if (match.getTile(position).type === "pipeSeam" && canAttackPipeseams) {
        attackTargetPositions.push(position);
      }
    } else {
      if (enemy.player.team !== unit.player.team && getBaseDamage(unit, enemy) !== null) {
        attackTargetPositions.push(position);
      }
    }
  }

  return attackTargetPositions;
};

export const calculatePathDistance = (unit: UnitWrapper, path: Position[]) => {
  let dist = 0;

  path.forEach((pos, index) => {
    if (index !== 0) {
      const moveCost = unit.getMovementCost(pos); //TODO cache movement costs

      if (moveCost === null) {
        return null;
      }

      dist += moveCost;
    }
  });

  return dist;
};

export const updatePath = (
  unit: UnitWrapper,
  accessibleNodes: Map<Position, PathNode>,
  path: Position[],
  newPos: Position,
): Position[] => {
  if (path.length !== 0) {
    const lastPosition = path.at(-1)!;

    for (const pos of path) {
      if (pos.isSame(newPos)) {
        //the "new" node is part of the current path, so delete all nodes after that one
        while (pos !== path.at(-1)) {
          path.pop();
        }

        return path;
      }
    }

    //check if new node is adjacent
    if (lastPosition.isNeighbour(newPos)) {
      const moveCost = unit.getMovementCost(newPos);
      const distanceCovered = calculatePathDistance(unit, path);

      //if it doesn't surpass movement restrictions, update current path
      if (moveCost !== null && moveCost + distanceCovered <= unit.getMovementPoints()) {
        path.push(newPos);
        return path;
      }
    }
  }

  //if the new position can't be added to the current path, recreate the entire path
  const newPath: Position[] = [];
  let currentPathNode = undefined;

  for (const [key, value] of accessibleNodes) {
    if (key.isSame(newPos)) {
      currentPathNode = value;
      break;
    }
  }

  if (currentPathNode === undefined) {
    return path;
  }

  while (currentPathNode !== undefined) {
    newPath.push(currentPathNode.pos);

    if (currentPathNode.parent === null) {
      break;
    }

    currentPathNode = accessibleNodes.get(currentPathNode.parent);
  }

  if (newPath.length === 0) {
    return path;
  }

  return newPath.toReversed();
};

const getSpriteName = (a: Position, b: Position, c: Position): string => {
  //path from a to b to c, the sprite is the one displayed in b (middle node)
  const difx = Math.abs(a.data[0] - c.data[0]);
  const dify = Math.abs(a.data[1] - c.data[1]);

  if (dify + difx === 2) {
    //not start nor end
    if (difx === 2) {
      return "ew";
    }

    if (dify === 2) {
      return "ns";
    }

    let ans: string;

    if (a.data[1] > b.data[1] || c.data[1] > b.data[1]) {
      ans = "s";
    } else {
      ans = "n";
    }

    if (a.data[0] > b.data[0] || c.data[0] > b.data[0]) {
      ans += "e";
    } else {
      ans += "w";
    }

    return ans;
  }

  if (a.data[0] === b.data[0] && a.data[1] === b.data[1]) {
    //starting node
    if (c.data[0] === b.data[0] && c.data[1] === b.data[1]) {
      //AND ending node
      return "od";
    }

    if (c.data[0] < b.data[0]) {
      return "ow";
    }

    if (c.data[0] > b.data[0]) {
      return "oe";
    }

    if (c.data[1] > b.data[1]) {
      return "os";
    }

    return "on";
  } else {
    //ending node
    if (a.data[0] < b.data[0]) {
      return "wd";
    }

    if (a.data[0] > b.data[0]) {
      return "ed";
    }

    if (a.data[1] < b.data[1]) {
      return "nd";
    }

    return "sd";
  }
};

export const showPath = (spriteSheet: LoadedSpriteSheet, path: Position[]) => {
  if (path.length < 1) {
    throw new Error("Empty path!");
  }

  const arrowContainer = new Container();
  arrowContainer.eventMode = "static";

  const path2 = [...path];
  path2.push(arr(path, "last")); //to detect the final node

  for (let i = 0; i < path.length; ++i) {
    let spriteName = "";

    if (i === 0) {
      //TODO i don't understand what this does
      //special case for original node
      //spriteName = getSpriteName(path2[0], path2[i], path2[i + 1]);
    } else {
      spriteName = getSpriteName(arr(path2, i - 1), arr(path2, i), arr(path2, i + 1));
    }

    const nodeSprite = new Sprite(spriteSheet.arrow.textures[spriteName + ".png"]);
    nodeSprite.anchor.set(1, 1);
    nodeSprite.x = (arr(path2, i).data[0] + 1) * baseTileSize;
    nodeSprite.y = (arr(path2, i).data[1] + 1) * baseTileSize;
    arrowContainer.addChild(nodeSprite);
  }

  //this label will let us easily remove arrows later
  arrowContainer.label = "pathArrows";
  arrowContainer.zIndex = 9999;
  return arrowContainer;
};
