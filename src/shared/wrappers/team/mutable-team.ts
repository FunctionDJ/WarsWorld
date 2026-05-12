import type { PlayerInMatch } from "shared/types/server-match-state";
import type { MutableMatch } from "../match/mutable-match";
import { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import type { MutableUnit } from "../unit/mutable-unit";
import type { MutableVision } from "../vision/mutable-vision";
import { Team } from "./team";

export class MutableTeam extends Team {
  public vision?: MutableVision = undefined; // changes from undefined to vision to undefined when it rains / clear in awds
  public readonly players: MutablePlayerInMatch[];

  constructor(
    players: readonly PlayerInMatch[],
    public readonly match: MutableMatch,
    index: number,
  ) {
    super(players, match, index);
    this.players = players.map((p) => new MutablePlayerInMatch(p, this));
  }

  addUnwrappedPlayer(player: PlayerInMatch): MutablePlayerInMatch {
    const playerWrapper = new MutablePlayerInMatch(player, this);
    this.players.push(playerWrapper);
    return playerWrapper;
  }

  getEnemyUnits(): readonly MutableUnit[] {
    return this.match.units.filter((unit) => !this.owns(unit));
  }
}
