import type { EmittableEvent } from "../../types/events";
import type { CapturableTile } from "../../types/server-match-state";
import type { MatchWrapper } from "../../wrappers/match/match";

export const fillDiscoveredUnitsAndProperties = (
  match: MatchWrapper,
  emittableEvents: (EmittableEvent | undefined)[],
): void => {
  // emittableEvents.length = math.teams.length + 1, since it has "no team" in the end
  for (const [i, team] of match.teams.entries()) {
    const emittableEvent = emittableEvents[i]; // have to save it in a variable cause typescript is too dumb

    if (emittableEvent === undefined) {
      continue;
    }

    // TODO this condition can be thinned out more (for example, only update sonja's own team,
    //  or pass turn only when cop deactivates or weather changes
    //  AND more importantly, skip if no fog of war (in previous turn (?))
    const recalculateVision =
      emittableEvent.type === "matchStart" ||
      emittableEvent.type === "passTurn" ||
      (emittableEvent.type === "coPower" &&
        (match.getCurrentTurnPlayer().data.coId.name === "sonja" ||
          match.getCurrentTurnPlayer().data.coId.name === "drake"));

    if (recalculateVision) {
      emittableEvent.discoveredUnits = team.getEnemyUnitsInVision();
      return;
    }

    if (team.vision === undefined) {
      // no fog of war
      return;
    }

    const discoveredUnits = [];
    const discoveredProperties: CapturableTile[] = [];

    for (const position of team.vision.getDiscoveredPositionsAndClear()) {
      const unit = match.getUnit(position);
      const tile = match.getTile(position);

      if (unit !== undefined) {
        discoveredUnits.push(unit.data);
      }

      if ("playerSlot" in tile) {
        discoveredProperties.push({
          ...tile,
          position: position,
        });
      }
    }

    // unused in backend, useful in frontend. Must flush so the array doesn't get too big.
    team.vision.getUndiscoveredPositionsAndClear();

    if (discoveredUnits.length > 0) {
      emittableEvent.discoveredUnits = discoveredUnits;
    }

    if (discoveredProperties.length > 0) {
      emittableEvent.discoveredProperties = discoveredProperties;
    }
  }

  // TODO handle player-eliminated changing properties clientside
};
