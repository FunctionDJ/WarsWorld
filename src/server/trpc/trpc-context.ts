import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { IncomingMessage } from "node:http";

export function createContext(options: CreateHTTPContextOptions | CreateWSSContextFnOptions): {
  req?: IncomingMessage;
} {
  const request = "req" in options ? options.req : undefined;

  return {
    // session,
    req: request,
    // Include res for Next.js API routes
    // res: "res" in opts ? opts.res : undefined,
  };
}

// Explicitly define Context as an object type
export type Context = ReturnType<typeof createContext>;
