import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { faq } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const UpdateFaqInputSchema = z.object({
  id: z.string(),
  mdx: z.string().nullable(),
});

export const faqRouter = createTRPCRouter({
  getFaq: publicProcedure.query(async ({ ctx }) => {
    const currFaq = await ctx.db.query.faq.findFirst();
    if (!currFaq) {
      throw new TRPCError({ code: "NOT_FOUND", message: "FAQ not found" });
    }
    return currFaq;
  }),

  updateFaq: protectedProcedure
    .input(UpdateFaqInputSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db
        .update(faq)
        .set({ mdx: input.mdx, updatedAt: new Date() })
        .where(eq(faq.id, input.id))
        .returning();
      if (!updated[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "FAQ not found" });
      }
      return updated[0];
    }),
});
