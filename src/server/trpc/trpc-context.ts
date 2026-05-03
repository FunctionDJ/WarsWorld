import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

export function createContext(opts: CreateHTTPContextOptions | CreateWSSContextFnOptions) {
  const req = "req" in opts ? opts.req : undefined;

  return {
    // session,
    req,
    // Include res for Next.js API routes
    res: "res" in opts ? opts.res : undefined,
  };
}

// Explicitly define Context as an object type
export type Context = ReturnType<typeof createContext>;
