import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { messages } from "~/server/db/schema";

const CreateMessageInputSchema = z.object({
  text: z.string().min(1),
});

const UpdateMessageInputSchema = z.object({
  text: z.string().optional(),
  isRead: z.boolean().optional(),
});

export const messagesRouter = createTRPCRouter({
  createMessage: publicProcedure
    .input(CreateMessageInputSchema)
    .mutation(async ({ input, ctx }) => {
      const message = await ctx.db
        .insert(messages)
        .values({
          text: input.text,
          userId: "mock-user-id",
        })
        .returning();
      return message[0];
    }),

  getMessages: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.messages.findMany({
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });
  }),

  getMessage: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.messages.findFirst({
        where: (messages, { eq }) => eq(messages.id, input.id),
      });
    }),

  getMessagesByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.messages.findMany({
        where: (messages, { eq }) => eq(messages.userId, input.userId),
        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
      });
    }),

  getMessagesCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.query.messages.findMany({
      where: (messages, { eq }) => eq(messages.userId, userId),
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });
  }),

  updateMessage: publicProcedure
    .input(z.object({ id: z.string(), data: UpdateMessageInputSchema }))
    .mutation(async ({ input, ctx }) => {
      const updatedMessage = await ctx.db
        .update(messages)
        .set({
          text: input.data.text,
          isRead: input.data.isRead,
        })
        .where(eq(messages.id, input.id))
        .returning();
      return updatedMessage[0];
    }),

  readMessage: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const updatedMessage = await ctx.db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, input.id))
        .returning();
      return updatedMessage[0];
    }),

  deleteMessage: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deletedMessage = await ctx.db
        .delete(messages)
        .where(eq(messages.id, input.id))
        .returning({ id: messages.id });
      return {
        id: deletedMessage[0]?.id,
        status: deletedMessage[0]?.id ? "deleted" : "error",
      };
    }),
});
