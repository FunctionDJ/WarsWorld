import type { WWMap } from "generated/browser";
import { DispatchableError } from "shared/errors";
import type { PlayerInMatch, PlayerInSetup } from "shared/server-match-state";
import type { MapWrapper } from "shared/wrappers/map";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MatchInSetup } from "shared/wrappers/match-in-setup";
import type { RO } from "shared/ww-readonly";

const mapToFrontend = (
	map: MapWrapper | RO<WWMap>,
): { id: string; name: string; numberOfPlayers: number } => {
	if ("data" in map) {
		return {
			id: map.data.id,
			name: map.data.name,
			numberOfPlayers: map.data.numberOfPlayers,
		};
	}

	return {
		id: map.id,
		name: map.name,
		numberOfPlayers: map.numberOfPlayers,
	};
};

export const matchToFrontend = (
	match: MatchWrapper | MatchInSetup,
): {
	id: string;
	map: ReturnType<typeof mapToFrontend>;
	players: readonly (PlayerInMatch | PlayerInSetup)[];
	state: string;
	turn: number;
} => {
	const players =
		match.type === "match-in-setup"
			? match.getAllPlayers()
			: match.getAllPlayers().map((player) => player.data);
	const turn = match.type === "match-in-setup" ? 0 : match.turn;

	return {
		id: match.id,
		map: mapToFrontend(match.map),
		players,
		state: match.type === "match-in-setup" ? "setup" : match.state,
		turn,
	};
};

export function getNextAvailableSlot(match: MatchWrapper): number {
	for (let index = 0; index < match.map.data.numberOfPlayers; index++) {
		if (match.getPlayerBySlot(index, "dont-throw") === undefined) {
			return index;
		}
	}

	throw new DispatchableError("No player slots available (game full)");
}
