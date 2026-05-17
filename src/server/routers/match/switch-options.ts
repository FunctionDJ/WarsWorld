import { globalEmittable } from "server/emitter/event-emitter";
import { prisma } from "server/prisma/prisma-client";
import { DispatchableError } from "shared/errors";
import { armySchema } from "shared/schemas/army";
import { coIdSchema } from "shared/schemas/co";
import { playerSlotForUnitsSchema } from "shared/schemas/player-slot";
import { z } from "zod";
import { matchInSetupBaseProcedure } from "../../trpc/trpc-setup";

export const switchOptions = matchInSetupBaseProcedure
	.input(
		z.object({
			// TODO separate this into 3 different endpoints
			selectedCO: coIdSchema.optional(),
			selectedArmy: armySchema.optional(),
			selectedSlot: playerSlotForUnitsSchema.optional(),
		}),
	)
	.mutation(async ({ input, ctx: { match, currentPlayer: player } }) => {
		const newPlayerData = match.findPlayerById(player.id);

		// TODO i think these 3 lines need to run after the checks
		newPlayerData.coId = input.selectedCO ?? newPlayerData.coId;
		newPlayerData.army = input.selectedArmy ?? newPlayerData.army;
		newPlayerData.slot = input.selectedSlot ?? newPlayerData.slot;

		const armiesOccupied = match.getAllPlayers().map((matchPlayer) => matchPlayer.army);
		const slotsOccupied = match.getAllPlayers().map((matchPlayer) => matchPlayer.slot);

		// ERROR CHECKING
		// make sures that the ARMY picked by the player is different from all other players
		if (input.selectedArmy !== undefined && armiesOccupied.includes(input.selectedArmy)) {
			throw new DispatchableError("Army is already picked by another player");
		}

		// make sures that the SLOT picked by the player is different from all other players
		if (input.selectedSlot !== undefined && slotsOccupied.includes(input.selectedSlot)) {
			throw new DispatchableError("Slot is already picked by another player");
		}

		// lets update prisma first, if the database updates, then we update memory
		await prisma.match.update({
			where: { id: match.id },
			data: { playerState: { type: "players-in-setup", players: match.getAllPlayers() } },
		});

		if (input.selectedCO !== undefined) {
			await globalEmittable(match, {
				type: "player-picked-co",
				coId: input.selectedCO,
				matchId: match.id,
				playerId: player.id,
			});
		}

		if (input.selectedArmy !== undefined) {
			await globalEmittable(match, {
				type: "player-picked-army",
				army: input.selectedArmy,
				matchId: match.id,
				playerId: player.id,
			});
		}

		if (input.selectedSlot !== undefined) {
			await globalEmittable(match, {
				type: "player-picked-slot",
				slot: input.selectedSlot,
				matchId: match.id,
				playerId: player.id,
			});
		}
	});
