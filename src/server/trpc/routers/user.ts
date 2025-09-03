import z from "zod";
import { userSchema } from "@/server/models/User";
import { updateUser } from "@/server/repositories/User";
import { protectedProcedure, router } from "../index";

export const userRouter = router({
  update: protectedProcedure
    .input(
      userSchema
        .pick({ email: true })
        .partial()
        .and(z.object({ password: z.string().optional() })),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await updateUser(ctx.user.id, input);
      return user;
    }),
});
