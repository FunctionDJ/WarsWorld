import { globalEmittable } from "server/emitter/event-emitter";
import { matchStore } from "server/match-store";
import { pageMatchIndex } from "server/page-match-index";
import { playerMatchIndex } from "server/player-match-index";
import { prisma } from "server/prisma/prisma-client";
import { matchInSetupBaseProcedure } from "../../trpc/trpc-setup";

export const leaveMatch = matchInSetupBaseProcedure.mutation(
	async ({ ctx: { match, currentPlayer: player } }) => {
		const playerBeforeMatch = match.findPlayerById(player.id);
		match.removePlayer(playerBeforeMatch);
		playerMatchIndex.onPlayerLeave({ matchId: match.id, player: playerBeforeMatch });
		const matchIsNowEmpty = match.getTeams().length === 0;

		if (matchIsNowEmpty) {
			pageMatchIndex.removeMatch(match);
			matchStore.removeMatchFromIndex(match);
			await prisma.match.delete({ where: { id: match.id } });
			return;
		}

		await prisma.match.update({
			where: { id: match.id },
			data: {
				playerState: {
					type: "players-in-setup",
					players: match.getAllPlayers(),
				},
			},
		});

		await globalEmittable(match, {
			type: "player-left",
			matchId: match.id,
			playerId: player.id,
		});
	},
);
