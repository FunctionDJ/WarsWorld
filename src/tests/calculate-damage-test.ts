import { attackActionToEvent } from "shared/match-logic/events/handlers/attack/attack-action-to-event";
import { Position } from "shared/schemas/position";
import { createMatch, createPlayerInMatch } from "./utilities";

// TODO
/**
 * add memory usage readouts by reading memory used by process
 * before creating the match, before generating the event, and after
 * generating the event, and then printing the total mem used as well as
 * the differences between these points.
 *
 * also add processing time readouts by taking the time at the same 3 stages
 * and just printing the differences.
 */

/**
 * this is a test scenario to fully simulate an attack event
 * and output the previous and resulting HP values to the console.
 * it's a standalone script that can be run with `bun file.ts`.
 * this scenario is a full HP andy infantry attacking
 * another infantry on roads with worst luck.
 *
 * when we add things like game versions for COs, match rules (?)
 * and units, these files will raise type errors and need to
 * be updated, so we should probably do that soon so we can start
 * testing our damage calculations that are going to become
 * more complex with the different game versions and skills later on.
 *
 * depending on how we go about this,
 * we might want to put these tests / scenarios into
 * a separate repository in order to keep the git history sane.
 * - Function
 */

console.log("simple infanty vs infantry");

{
  const match = createMatch([createPlayerInMatch({ slot: 0 }), createPlayerInMatch({ slot: 1 })]);

  const p1 = match.getPlayerBySlot(0);
  const p2 = match.getPlayerBySlot(1);

  const u1 = p1.addUnwrappedUnit({
    type: "infantry",
    position: new Position([0, 0]),
  });

  const u2 = p2.addUnwrappedUnit({
    type: "infantry",
    position: new Position([1, 0]),
  });

  const { attackerHP, defenderHP } = attackActionToEvent(
    match,
    {
      type: "attack",
      defenderPosition: u2.data.position,
    },
    u1.data.position,
    true,
    {
      goodLuck: 0.5,
      badLuck: 0.5,
    },
    {
      goodLuck: 0.5,
      badLuck: 0.5,
    },
  );

  console.log("attacker HP:", u1.data.hp, "=>", attackerHP ?? "(no counter)");
  console.log("defender HP:", u2.data.hp, "=>", defenderHP);
}

// from AW wiki:
/**
 * for example, a Hitpoints 1 Aw2jess Jess Infantry attacking a Missile that has exactly
 * 60% defense will deal 0.936% damage with 0% luck, which will round up to 0.95%
 * and then round down to 0%. However, for 1% luck or higher,
 * this will first round up to at least 1% which rounds down to a flat 1% damage instead.
 */

// how to get 60% def: kanbei, no power, on city

console.log("testing luck thresholds: 0% luck should round down to 0% damage");

{
  const match = createMatch(
    [
      createPlayerInMatch({ slot: 0 }),
      createPlayerInMatch({ slot: 1, coId: { name: "kanbei", version: "AW2" } }),
    ],
    {
      map: {
        tiles: [
          [
            { type: "plain", variant: "normal" },
            { type: "city", playerSlot: 1, hp: 20 },
          ],
        ],
      },
    },
  );

  const p1 = match.getPlayerBySlot(0);
  const p2 = match.getPlayerBySlot(1);

  const u1 = p1.addUnwrappedUnit({
    type: "infantry",
    position: new Position([0, 0]),
  });

  const u2 = p2.addUnwrappedUnit({
    type: "missile",
    position: new Position([1, 0]),
    ammo: 6,
  });

  const { attackerHP, defenderHP } = attackActionToEvent(
    match,
    {
      type: "attack",
      defenderPosition: u2.data.position,
    },
    u1.data.position,
    true,
    {
      goodLuck: 0,
      badLuck: 0,
    },
    {
      goodLuck: 0,
      badLuck: 0,
    },
  );

  console.log("attacker HP:", u1.data.hp, "=>", attackerHP ?? "(no counter)");
  console.log("defender HP:", u2.data.hp, "=>", defenderHP);
}

console.log("testing luck thresholds: 1% luck should round up to 1% damage");

{
  const match = createMatch(
    [
      createPlayerInMatch({ slot: 0 }),
      createPlayerInMatch({ slot: 1, coId: { name: "kanbei", version: "AW2" } }),
    ],
    {
      map: {
        tiles: [
          [
            { type: "plain", variant: "normal" },
            { type: "city", playerSlot: 1, hp: 20 },
          ],
        ],
      },
    },
  );

  const p1 = match.getPlayerBySlot(0);
  const p2 = match.getPlayerBySlot(1);

  const u1 = p1.addUnwrappedUnit({
    type: "infantry",
    position: new Position([0, 0]),
  });

  const u2 = p2.addUnwrappedUnit({
    type: "missile",
    position: new Position([1, 0]),
    ammo: 6,
  });

  const { attackerHP, defenderHP } = attackActionToEvent(
    match,
    {
      type: "attack",
      defenderPosition: u2.data.position,
    },
    u1.data.position,
    true,
    {
      goodLuck: 0.01,
      badLuck: 0,
    },
    {
      goodLuck: 0.01,
      badLuck: 0,
    },
  );

  console.log("attacker HP:", u1.data.hp, "=>", attackerHP ?? "(no counter)");
  console.log("defender HP:", u2.data.hp, "=>", defenderHP);
}
