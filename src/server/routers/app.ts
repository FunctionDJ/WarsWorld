import { router } from "../trpc/trpc-setup";
import { actionRouter } from "./action";
import { mapRouter } from "./map";
import { matchRouter } from "./match";
import { userRouter } from "./user";

export const appRouter = router({
	match: matchRouter,
	map: mapRouter,
	action: actionRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
