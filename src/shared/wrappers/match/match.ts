import type { LeagueType, Match, MatchStatus, Player, WWMap } from "generated/browser";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { Position } from "shared/schemas/position";
import { passableTileSchema, type PassableTile } from "shared/schemas/tile";
import type { UnitTypeString, Visibility, WWUnit } from "shared/schemas/unit";
import type { Weather } from "shared/schemas/weather";
import {
  createNeutralPlayerInMatch,
  type ChangeableTile,
  type PlayerInMatch,
} from "shared/types/server-match-state";
import {
  findOrThrow,
  throwIfUndefinedUnlessAccepted,
  type DontThrow,
} from "shared/types/throw-helper";
import type { WWReadOnly } from "shared/types/ww-readonly";
import { MapWrapper } from "../map";
import { PlayerInMatchWrapper } from "../player/player-in-match";
import { getTeamPlayers } from "../team/get-team-players";
import { Team } from "../team/team";
import { Transport } from "../unit/transport";
import { UnitWrapper } from "../unit/unit";

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
  protected currentWeather: Weather = "clear";
  public playerToRemoveWeatherEffect?: PlayerInMatchWrapper = undefined;
  public weatherDaysLeft = 0;
  public readonly teams: Team[] = [];
  protected neutralPlayer: PlayerInMatchWrapper;
  /**
   * TODO
   *
   * this property is a candidate for ArrayBuffer / IntArray optimization
   * just like Vision currently has.
   */
  public units: UnitWrapper[];
  public map: MapWrapper;

  constructor(
    public readonly id: Match["id"],
    public readonly leagueType: LeagueType,
    //TODO change to map from position to changeableTile for better performance
    public readonly changeableTiles: readonly WWReadOnly<ChangeableTile>[],
    public readonly rules: MatchRules,
    public state: MatchStatus,
    map: WWReadOnly<WWMap>,
    players: readonly PlayerInMatch[],
    units: readonly WWUnit[],
    public turn: number,
  ) {
    this.map = new MapWrapper(map);

    this.teams = this.rules.teamMapping.map((teamIndex) => {
      const teamPlayers = getTeamPlayers(teamIndex, this.rules, players);
      return new Team(teamPlayers, this, teamIndex);
    });

    this.units = units.map(
      (unit): UnitWrapper =>
        unit.type === "apc" ||
        unit.type === "transportCopter" ||
        unit.type === "blackBoat" ||
        unit.type === "lander" ||
        unit.type === "carrier" ||
        unit.type === "cruiser"
          ? new Transport(unit, this)
          : new UnitWrapper<Visibility, UnitTypeString>(unit, this),
    );
    const neutralPlayerInMatch = createNeutralPlayerInMatch();
    const neutralTeam = new Team([neutralPlayerInMatch], this, -1);

    this.neutralPlayer = new PlayerInMatchWrapper(neutralPlayerInMatch, neutralTeam);
  }

  isFogOfWar(): boolean {
    return (
      this.rules.fogOfWar || (this.rules.gameVersion === "AWDS" && this.currentWeather === "rain")
    );
  }

  getCurrentWeather(): Weather {
    return this.currentWeather;
  }

  getTile(position: Position): PassableTile | ChangeableTile {
    this.map.throwIfOutOfBounds(position);

    const foundChangeableTile = this.changeableTiles.find((t) => position.isSame(t.position));

    if (foundChangeableTile !== undefined) {
      const isBrokenPipeSeam = "hp" in foundChangeableTile && foundChangeableTile.hp < 1;

      if (isBrokenPipeSeam) {
        const tile = this.getTile(position);

        if (!("variant" in tile)) {
          throw new Error(
            "This should never happen since all pipe seam tiles should have variants",
          );
        }

        return {
          category: "variable",
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

  getPassableTile(position: Position): PassableTile {
    const tile = this.getTile(position);
    const parsed = passableTileSchema.safeParse(tile);

    if (!parsed.success) {
      throw new Error("Tile is not passable");
    }

    return parsed.data;
  }

  // PLAYER STUFF **************************************************************
  getCurrentTurnPlayer(): PlayerInMatchWrapper {
    return findOrThrow(this.getAllPlayers(), (p) => p.data.hasCurrentTurn);
  }

  getAllPlayers(): readonly PlayerInMatchWrapper[] {
    return this.teams
      .flatMap((team) => team.players)
      .toSorted((p1, p2) => p1.data.slot - p2.data.slot);
  }

  getPlayerById(playerId: Player["id"]): WWReadOnly<PlayerInMatchWrapper> {
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

  getUnit(position: Position): UnitWrapper;
  getUnit(position: Position, dontThrow: DontThrow): UnitWrapper | undefined;
  getUnit(position: Position, dontThrow?: DontThrow): UnitWrapper | undefined {
    const unit = this.units.find((u) => position.isSame(u.data.position));
    return throwIfUndefinedUnlessAccepted(unit, dontThrow);
  }
}
