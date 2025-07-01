import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { systems, teams } from "~/server/db/schema";
import { eq } from "drizzle-orm"; // Removed 'and' as it's not used
import { TRPCError } from "@trpc/server";

const CreateSystemInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  teamId: z.string().min(1, "Team ID is required"),
});

const UpdateSystemInputSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().optional(),
  teamId: z.string().min(1, "Team ID cannot be empty").optional(),
});

export const systemsRouter = createTRPCRouter({
  createSystem: protectedProcedure
    .input(CreateSystemInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const teamExists = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });
      if (!teamExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Team with id '${input.teamId}' not found or you don\'t have permission.`,
        });
      }

      const newSystem = await ctx.db
        .insert(systems)
        .values({
          name: input.name,
          description: input.description,
          teamId: input.teamId,
        })
        .returning();

      if (!newSystem[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create system",
        });
      }
      return newSystem[0];
    }),

  getSystems: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.systems.findMany({
      orderBy: (systems, { asc }) => [asc(systems.name)],
    });
  }),

  getSystemsByTeam: publicProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.systems.findMany({
        where: eq(systems.teamId, input.teamId),
        orderBy: (systems, { asc }) => [asc(systems.name)],
      });
    }),

  getSystem: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const system = await ctx.db.query.systems.findFirst({
        where: eq(systems.id, input.id),
      });
      if (!system) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `System with id '${input.id}' not found`,
        });
      }
      return system;
    }),

  updateSystem: protectedProcedure
    .input(z.object({ id: z.string(), data: UpdateSystemInputSchema }))
    .mutation(async ({ input, ctx }) => {
      if (input.data.teamId) {
        const teamExists = await ctx.db.query.teams.findFirst({
          where: eq(teams.id, input.data.teamId),
        });
        if (!teamExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Target team with id '${input.data.teamId}' not found.`,
          });
        }
      }

      const updatedSystem = await ctx.db
        .update(systems)
        .set({
          name: input.data.name,
          description: input.data.description,
          teamId: input.data.teamId,
          updatedAt: new Date(),
        })
        .where(eq(systems.id, input.id))
        .returning();

      if (!updatedSystem[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to update system with id '${input.id}'. It might not exist or you don\'t have permission.`,
        });
      }
      return updatedSystem[0];
    }),

  deleteSystem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deletedSystem = await ctx.db
        .delete(systems)
        .where(eq(systems.id, input.id))
        .returning({ id: systems.id });

      if (!deletedSystem[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to delete system with id '${input.id}'. It might not exist or you don\'t have permission.`,
        });
      }
      return { id: deletedSystem[0].id, status: "deleted" };
    }),
});
