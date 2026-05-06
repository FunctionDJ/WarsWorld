import { createTRPCwebSocketServer } from "./common-server";
import { matchStore } from "./match-store";

void (async (): Promise<void> => {
  await matchStore.rebuild();

  const wss = createTRPCwebSocketServer({
    port: 3001,
  });

  wss.on("connection", (ws) => {
    console.log(`➕➕ Connection (${String(wss.clients.size)})`);
    ws.once("close", () => {
      console.log(`➖➖ Connection (${String(wss.clients.size)})`);
    });
  });

  console.log(`Development mode: tRPC listening on ${String(process.env.NEXT_PUBLIC_WS_URL)}`);
})();
