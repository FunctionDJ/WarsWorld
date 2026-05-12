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
import {
  findOrThrow,
  throwIfUndefined,
  throwIfUndefinedUnlessAccepted,
  type DontThrow,
} from "shared/types/throw-helper";
import type { RO } from "shared/types/ww-readonly";
import { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import { getTeamPlayers } from "../team/get-team-players";
import { MutableTeam } from "../team/mutable-team";
import { MutableTransport } from "../unit/mutable-transport";
import { MutableUnit } from "../unit/mutable-unit";
import type { UnitWrapper } from "../unit/unit";
import { MutableVision } from "../vision/mutable-vision";
import { MatchWrapper } from "./match";

export class MutableMatch extends MatchWrapper {
  public readonly units: MutableUnit[];
  protected currentWeather: Weather = "clear";
  public weatherDaysLeft = 0;

  public readonly teams: MutableTeam[];
  protected neutralPlayer: MutablePlayerInMatch;
  public playerToRemoveWeatherEffect?: MutablePlayerInMatch = undefined;

  constructor(
    id: Match["id"],
    leagueType: LeagueType,
    //TODO change to map from position to changeableTile for better performance
    public readonly changeableTiles: readonly ChangeableTile[],
    public readonly rules: RO<MatchRules>,
    public state: MatchStatus,
    map: RO<WWMap>,
    players: readonly PlayerInMatch[],
    units: RO<WWUnit[]>,
    public turn: number,
  ) {
    if (rules.teamMapping.length === 0) {
      throw new DispatchableError("rules.teamMapping must have at least one team");
    }

    if (map.tiles.length === 0) {
      throw new DispatchableError("map must have at least one tile row");
    }

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

  getPlayerBySlot(playerSlot: PlayerSlot): MutablePlayerInMatch;
  getPlayerBySlot(playerSlot: PlayerSlot, dontThrow: DontThrow): MutablePlayerInMatch | undefined;
  getPlayerBySlot(playerSlot: PlayerSlot, dontThrow?: DontThrow): MutablePlayerInMatch | undefined {
    if (playerSlot < 0) {
      return this.neutralPlayer;
    }

    const player = this.getAllPlayers().find((p) => p.data.slot === playerSlot);
    return throwIfUndefinedUnlessAccepted(player, dontThrow);
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

  addUnwrappedPlayer(player: RO<PlayerInMatch>): MutablePlayerInMatch {
    const teamIndex = throwIfUndefined(this.rules.teamMapping[player.slot]);
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
    for (const unitInRadius of this.units.filter(
      (unit: RO<UnitWrapper>) => unit.data.position.getDistance(epicenter) <= radius,
    )) {
      unitInRadius.damageUntil1HP(visualHpAmount);
    }
  }

  getUnit(position: Position): MutableUnit;
  getUnit(position: Position, dontThrow: DontThrow): MutableUnit | undefined;
  getUnit(position: Position, dontThrow?: DontThrow): MutableUnit | undefined {
    const unit = this.units.find((u) => position.isSame(u.data.position));
    return throwIfUndefinedUnlessAccepted(unit, dontThrow);
  }

  getPlayerById(playerId: Player["id"]): MutablePlayerInMatch {
    return findOrThrow(this.getAllPlayers(), (p) => p.data.id === playerId);
  }

  getCurrentTurnPlayer(): MutablePlayerInMatch {
    return findOrThrow(this.getAllPlayers(), (p) => p.data.hasCurrentTurn);
  }
}
