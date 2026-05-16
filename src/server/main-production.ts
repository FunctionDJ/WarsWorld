import next from "next";
import http from "node:http";
import { parse } from "node:url";
import { throwIfUndefined } from "shared/throw-helper";
import { createTRPCwebSocketServer } from "./common-server";
import { matchStore } from "./match-store";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const app = next({ dev: false });
const handler = app.getRequestHandler();

await matchStore.rebuild();
await app.prepare();

const server = http.createServer((request, response) => {
  const url = throwIfUndefined(request.url);

  if (request.headers["x-forwarded-proto"] === "http") {
    if (request.headers.host === undefined || typeof request.headers.url !== "string") {
      throw new Error("Headers are incorrect");
    }

    // redirect to ssl
    response.writeHead(303, {
      location: `https://` + request.headers.host + request.headers.url,
    });
    response.end();

    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    response.end();
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  response.setHeader("Access-Control-Allow-Credentials", "true");

  // set browsers to deny framing into an iframe (framebusting)
  response.setHeader("X-Frame-Options", "DENY");

  // set content security policy
  response.setHeader("Content-Security-Policy", "frame-ancestors 'self'");

  // prevent MIME sniffing
  response.setHeader("X-Content-Type-Options", "nosniff");

  // prevents cross origin script loading
  response.setHeader("Referrer-Policy", "same-origin");

  const parsedUrl = parse(url, true);
  void handler(request, response, parsedUrl);
});

createTRPCwebSocketServer({ server });
server.listen(port);

console.log(
  `Production mode: Server listening at ${String(process.env.NEXT_PUBLIC_WS_URL)}${String(port)}`,
);
