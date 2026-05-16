import type { LeagueType, Match, MatchStatus, Player, WWMap } from "generated/browser";
import { arrayAtOrThrow } from "shared/array-utilities";
import { InvalidStateError } from "shared/errors";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { Position } from "shared/schemas/position";
import type { PositionedTile, Tile } from "shared/schemas/tile";
import type { UnitData } from "shared/schemas/unit-schemas";
import type { Weather } from "shared/schemas/weather";
import { createNeutralPlayerInMatch, type PlayerInMatch } from "shared/server-match-state";
import {
  findOrThrow,
  throwIfUndefined,
  throwIfUndefinedUnlessAccepted,
  type DontThrow,
} from "shared/throw-helper";
import type { RO } from "shared/ww-readonly";
import { MapWrapper } from "./map";
import { PlayerInMatchWrapper } from "./player-in-match";
import { Team } from "./team";
import { Unit } from "./unit";
import { Vision } from "./vision";

/**
 * an alternative to storing tile sprite references through the generic data type
 * could something like this on the frontend:
 *
 * const cityNeutral = mapContainer.getChildAt(1)
 * cityNeutral.removeFromParent();
 *
 * const cityOrangeStar = new AnimatedSprite("...");
 * mapContainer.addChildAt(cityOrangeStar, 1)
 */

/** TODO: Add favorites, possibly spectators, also a timer */
export class MatchWrapper {
  public readonly type = "match-wrapper";
  public currentWeather: Weather = "clear";
  public weatherDaysLeft = 0;
  public readonly teams: Team[] = [];
  public readonly neutralPlayer: PlayerInMatchWrapper;
  public playerToRemoveWeatherEffect?: PlayerInMatchWrapper = undefined;

  // TODO
  /**
   * this property is a candidate for ArrayBuffer / IntArray optimization
   * just like Vision currently has.
   */
  public readonly units: Unit[];
  public readonly map: MapWrapper;
  //TODO change to JS Map<> from position to changeableTile for better performance
  public changeableTiles: readonly PositionedTile[] = [];
  public state: MatchStatus = "playing";
  public leagueType: LeagueType = "standard";
  public turn = 0;

  constructor(
    public readonly id: Match["id"],
    public readonly rules: MatchRules,
    map: RO<WWMap>,
    players: readonly RO<PlayerInMatch>[],
    units: readonly UnitData[],
  ) {
    if (rules.teamMapping.length === 0) {
      throw new InvalidStateError("rules.teamMapping must have at least one team");
    }

    if (map.tiles.length === 0) {
      throw new InvalidStateError("map must have at least one tile row");
    }

    this.map = new MapWrapper(map);

    this.teams = this.rules.teamMapping.map((teamIndex) => {
      // get all keys of teamMapping with value of teamIndex
      const playerSlotsInTeam = new Set(
        rules.teamMapping
          .map((team, index) => (team === teamIndex ? index : undefined))
          .filter((index): index is number => index !== undefined),
      );

      const teamPlayers = players.filter((p) => playerSlotsInTeam.has(p.slot));
      return new Team(teamPlayers, this, teamIndex);
    });

    this.units = units.map((unit) => new Unit(this.getPlayerBySlot(unit.playerSlot), unit));

    const neutralPlayerInMatch = createNeutralPlayerInMatch();
    const neutralTeam = new Team([neutralPlayerInMatch], this, -1);

    this.neutralPlayer = new PlayerInMatchWrapper(neutralTeam, neutralPlayerInMatch);
  }

  isFogOfWar(): boolean {
    return (
      this.rules.fogOfWar || (this.rules.gameVersion === "AWDS" && this.currentWeather === "rain")
    );
  }

  getCurrentWeather(): Weather {
    return this.currentWeather;
  }

  getTile(position: Position): Tile {
    this.map.throwIfOutOfBounds(position);

    const foundChangeableTile = this.changeableTiles.find((t) => position.isSame(t.position));

    if (foundChangeableTile !== undefined) {
      const isBrokenPipeSeam = "hp" in foundChangeableTile && foundChangeableTile.hp < 1;

      if (isBrokenPipeSeam) {
        const tile = this.getTile(position);

        if (!("variant" in tile)) {
          throw new InvalidStateError(
            "This should never happen since all pipe seam tiles should have variants",
          );
        }

        return {
          type: "plain",
          variant: `broken-pipe-${tile.variant === "top-bottom" ? "top-bottom" : "right-left"}`,
        };
      }

      return foundChangeableTile;
    }

    // TODO `match.getTile` will be called very often. map data is a candidate for
    // the same ArrayBuffer / IntArray optimization like exists for vision.
    return this.map.getTile(position);
  }

  getCurrentTurnPlayer(): PlayerInMatchWrapper {
    return findOrThrow(this.getAllPlayers(), (p) => p.data.hasCurrentTurn);
  }

  getAllPlayers(): readonly PlayerInMatchWrapper[] {
    return this.teams
      .flatMap((team) => team.players)
      .toSorted((p1, p2) => p1.data.slot - p2.data.slot);
  }

  getPlayerById(playerId: Player["id"]): PlayerInMatchWrapper {
    return findOrThrow(this.getAllPlayers(), (p) => p.data.id === playerId);
  }

  getPlayerBySlot(playerSlot: PlayerSlot, dontThrow: DontThrow): PlayerInMatchWrapper | undefined;
  getPlayerBySlot(playerSlot: PlayerSlot): PlayerInMatchWrapper;
  getPlayerBySlot(playerSlot: PlayerSlot, dontThrow?: DontThrow): PlayerInMatchWrapper | undefined {
    if (playerSlot === -1) {
      return this.neutralPlayer;
    }

    const player = this.getAllPlayers().find((p) => p.data.slot === playerSlot);
    return throwIfUndefinedUnlessAccepted(player, dontThrow);
  }

  getUnit(position: Position): Unit;
  getUnit(position: Position, dontThrow: DontThrow): Unit | undefined;
  getUnit(position: Position, dontThrow?: DontThrow): Unit | undefined {
    const unit = this.units.find((u) => position.isSame(u.data.position));
    return throwIfUndefinedUnlessAccepted(unit, dontThrow);
  }

  setWeather(weather: Weather, duration: number): void {
    this.currentWeather = weather;
    this.playerToRemoveWeatherEffect = this.getCurrentTurnPlayer();
    this.weatherDaysLeft = duration;

    if (this.rules.gameVersion === "AWDS" && !this.rules.fogOfWar) {
      // check for rain/clear fog of war activation
      for (const team of this.teams) {
        team.vision = weather === "rain" ? new Vision(team) : undefined;
      }
    }
  }

  addUnwrappedPlayer(player: RO<PlayerInMatch>): PlayerInMatchWrapper {
    const teamIndex = throwIfUndefined(this.rules.teamMapping[player.slot]);
    const foundTeam = this.teams.find((team) => team.index === teamIndex);

    if (foundTeam === undefined) {
      const team = new Team([player], this, teamIndex);
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
      (unit: RO<Unit>) => unit.data.position.getDistance(epicenter) <= radius,
    )) {
      unitInRadius.damageUntil1HP(visualHpAmount);
    }
  }
}
