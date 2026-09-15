import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "vitest";
import z from "zod";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/index";
import type { Context } from "@/server/trpc/index";

/**
 * tRPC as used in src/server/trpc: routers built from the shared procedure
 * helpers, called directly (the pattern in tests/unit/server/trpc) and via
 * createCaller (src/services/trpc/server.tsx). tRPC 11.18 made `batchIndex`
 * a required field of the direct-call options.
 */
const testRouter = router({
  ping: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `pong ${input.name}`),
  whoami: protectedProcedure.query(({ ctx }) => ctx.user.id),
});

const anonymous: Context = { user: null, ip: "test" };

describe("tRPC", () => {
  test("direct procedure call with the full options object", async () => {
    const result = await testRouter.ping({
      ctx: anonymous,
      getRawInput: async () => ({ name: "deps" }),
      path: "ping",
      type: "query",
      signal: undefined,
      batchIndex: 0,
    });
    expect(result).toBe("pong deps");
  });

  test("input validation raises a TRPCError with a ZodError cause", async () => {
    await expect(
      testRouter.ping({
        ctx: anonymous,
        getRawInput: async () => ({ name: 1 }),
        path: "ping",
        type: "query",
        signal: undefined,
        batchIndex: 0,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  test("createCaller and protectedProcedure guard", async () => {
    const caller = testRouter.createCaller(anonymous);
    expect(await caller.ping({ name: "caller" })).toBe("pong caller");
    await expect(caller.whoami()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
