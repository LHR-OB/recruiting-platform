import { publicProcedure, router } from "../trpc";
import { db } from "~/server/db";
import { faq } from "~/server/db/schema";
import { z } from "zod";

export const faqRouter = router({
  update: publicProcedure
    .input(z.object({ id: z.string(), mdx: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(faq)
        .set({ mdx: input.mdx, updatedAt: new Date() })
        .where(faq.id.eq(input.id));
      return { success: true };
    }),
});
