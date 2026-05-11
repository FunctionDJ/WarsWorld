import { createWSClient, wsLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { createTRPCNext } from "@trpc/next";
import { ssrPrepass } from "@trpc/next/ssrPrepass";
import type { NextPageContext } from "next";
import type { AppRouter } from "server/routers/app";
import superjson from "superjson";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

if (APP_URL === undefined || WS_URL === undefined) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_WS_URL environment variable is undefined. tRPC client can't be set up.",
  );
}

const getEndingLink = (ctx: NextPageContext | undefined) => {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: `${APP_URL}/api/trpc`,
      transformer: superjson,
      headers() {
        if (!ctx?.req?.headers) {
          return {};
        }

        // on ssr, forward client's headers to the server
        return {
          ...ctx.req.headers,
          "x-ssr": "1",
        };
      },
    });
  }

  return wsLink<AppRouter>({
    client: createWSClient({ url: WS_URL }),
    transformer: superjson,
  });
};

export const trpc = createTRPCNext<AppRouter>({
  config(config) {
    const { ctx } = config;

    return {
      links: [
        loggerLink({
          // enabled: () => false,
          enabled: (opts) =>
            (process.env.NODE_ENV === "development" && typeof window !== "undefined") ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
      queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  transformer: superjson,
  ssr: true,
  ssrPrepass: ssrPrepass,
});
