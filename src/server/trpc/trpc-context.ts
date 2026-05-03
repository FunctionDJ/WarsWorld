import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import { getSession } from "next-auth/react";

export async function createContext(opts: CreateHTTPContextOptions | CreateWSSContextFnOptions) {
  const req = "req" in opts ? opts.req : undefined;
  const session = await getSession({ req });

  return {
    session,
    req,
    // Include res for Next.js API routes
    res: "res" in opts ? opts.res : undefined,
  };
}

// Explicitly define Context as an object type
export type Context = Awaited<ReturnType<typeof createContext>>;
