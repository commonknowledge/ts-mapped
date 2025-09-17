import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import logger from "@/server/services/logger";
import { createContext } from "@/server/trpc";
import { appRouter } from "@/server/trpc/router";

const ACCEPTED_ERROR_CODES: (TRPCError["code"] | string)[] = [];

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    async onError({ error, path, input, ctx, type }) {
      if (
        error instanceof TRPCError &&
        ACCEPTED_ERROR_CODES.includes(error.code)
      ) {
        logger.warn(`Ignored tRPC error (code: ${error.code}) on '${path}'`, {
          error,
        });
        return;
      }

      Sentry.withScope((scope) => {
        if (ctx?.user) {
          scope.setUser({
            id: ctx.user.id,
            email: ctx.user.email,
          });
        }

        if (req) {
          scope.setTag("http.method", req.method);
          scope.setTag("http.url", req.url);
        }

        scope.setTag("trpc.type", type);
        scope.setTag("trpc.path", path || "unknown");
        scope.setTag("trpc.error.code", error.code);
        scope.setTag("error.name", error.name);

        Sentry.captureException(error, {
          extra: { input, ctx, error },
        });
      });

      logger.error(`tRPC Error on '${path}'`, { error, type, input });
    },
  });
}
export { handler as GET, handler as POST };
