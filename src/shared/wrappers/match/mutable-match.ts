import type { LeagueType, Match, MatchStatus, Player, WWMap } from "generated/browser";
import { arrayAtOrThrow } from "shared/array-utilities";
import { DispatchableError } from "shared/dispatchable-error";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { Position } from "shared/schemas/position";
import type { UnitTypeString, Visibility, WWUnit } from "shared/schemas/unit";
import type { Weather } from "shared/schemas/weather";
import {
  createNeutralPlayerInMatch,
  type ChangeableTile,
  type PlayerInMatch,
} from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";
import { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import { getTeamPlayers } from "../team/get-team-players";
import { MutableTeam } from "../team/mutable-team";
import { MutableTransport } from "../unit/mutable-transport";
import { MutableUnit } from "../unit/mutable-unit";
import { MutableVision } from "../vision/mutable-vision";
import { MatchWrapper } from "./match";

export class MutableMatch extends MatchWrapper {
  public readonly units: MutableUnit[];
  public readonly teams: MutableTeam[];
  protected neutralPlayer: MutablePlayerInMatch;

  constructor(
    id: Match["id"],
    leagueType: LeagueType,
    changeableTiles: readonly ChangeableTile[], //TODO change to map from position to changeableTile for better performance
    public readonly rules: WWReadOnly<MatchRules>,
    public state: MatchStatus,
    map: WWReadOnly<WWMap>,
    players: readonly PlayerInMatch[],
    units: WWReadOnly<WWUnit[]>,
    public turn: number,
  ) {
    super(id, leagueType, changeableTiles, rules, state, map, players, units, turn);
    this.units = units.map(
      (unit): MutableUnit =>
        unit.type === "apc" ||
        unit.type === "transportCopter" ||
        unit.type === "blackBoat" ||
        unit.type === "lander" ||
        unit.type === "carrier" ||
        unit.type === "cruiser"
          ? new MutableTransport(unit, this)
          : new MutableUnit<Visibility, UnitTypeString>(unit, this),
    );

    this.teams = this.rules.teamMapping.map(
      (teamIndex) =>
        new MutableTeam(getTeamPlayers(teamIndex, this.rules, players), this, teamIndex),
    );

    const neutralPlayerInMatch = createNeutralPlayerInMatch();
    const neutralTeam = new MutableTeam([neutralPlayerInMatch], this, -1);
    this.neutralPlayer = new MutablePlayerInMatch(neutralPlayerInMatch, neutralTeam);
  }

  getAllPlayers(): readonly MutablePlayerInMatch[] {
    return this.teams
      .flatMap((team) => team.players)
      .toSorted((p1, p2) => p1.data.slot - p2.data.slot);
  }

  getPlayerBySlot(playerSlot: PlayerSlot): MutablePlayerInMatch | undefined {
    if (playerSlot < 0) {
      return this.neutralPlayer;
    }

    return this.getAllPlayers().find((p) => p.data.slot === playerSlot);
  }

  getPlayerBySlotOrThrow(playerSlot: PlayerSlot): MutablePlayerInMatch {
    const player = this.getPlayerBySlot(playerSlot);

    if (player === undefined) {
      throw new Error(`Could not find player by slot ${String(playerSlot)}`);
    }

    return player;
  }

  setWeather(weather: Weather, duration: number): void {
    this.currentWeather = weather;
    this.playerToRemoveWeatherEffect = this.getCurrentTurnPlayer();
    this.weatherDaysLeft = duration;

    if (this.rules.gameVersion === "AWDS" && !this.rules.fogOfWar) {
      // check for rain/clear fog of war activation
      for (const team of this.teams) {
        team.vision = weather === "rain" ? new MutableVision(team) : undefined;
      }
    }
  }

  addUnwrappedPlayer(player: PlayerInMatch): MutablePlayerInMatch {
    const teamIndex = this.rules.teamMapping[player.slot];

    if (teamIndex === undefined) {
      throw new Error(
        `Player slot ${String(player.slot)} does not have a corresponding team in the team mapping.`,
      );
    }

    const foundTeam = this.teams.find((team) => team.index === teamIndex);

    if (foundTeam === undefined) {
      const team = new MutableTeam([player], this, teamIndex);
      this.teams.push(team);
      return arrayAtOrThrow(team.players, 0);
    }

    return foundTeam.addUnwrappedPlayer(player);
  }

  /**
   * IMPORTANT!
   * Param is VISUAL hp, since all sources of damaging without killing
   * are "multiples of 10" (nothing does 25 damage, for example)
   */
  damageUntil1HPInRadius({
    radius,
    visualHpAmount,
    epicenter,
  }: Readonly<{
    radius: number;
    visualHpAmount: number;
    epicenter: Position;
  }>): void {
    for (const unit of this.units.filter(
      (unit) => unit.data.position.getDistance(epicenter) <= radius,
    )) {
      unit.damageUntil1HP(visualHpAmount);
    }
  }

  getUnit(position: Position): MutableUnit | undefined {
    return this.units.find((u) => position.isSame(u.data.position));
  }

  getUnitOrThrow(position: Position): MutableUnit {
    const unit = this.getUnit(position);

    if (unit === undefined) {
      throw new DispatchableError(`No unit found at ${JSON.stringify(position)}`);
    }

    return unit;
  }

  getPlayerById(playerId: Player["id"]): MutablePlayerInMatch | undefined {
    return this.getAllPlayers().find((p) => p.data.id === playerId);
  }

  getCurrentTurnPlayer(): MutablePlayerInMatch {
    const player = this.getAllPlayers().find((p) => p.data.hasCurrentTurn);

    if (player === undefined) {
      throw new Error("No player with current turn was found");
    }

    return player;
  }
}
