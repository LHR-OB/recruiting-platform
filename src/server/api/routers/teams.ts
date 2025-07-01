import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { teams, systems, users } from "~/server/db/schema"; // Assuming 'systems' might be related or managed here too
import { eq, is } from "drizzle-orm"; // Removed 'and' as it's not used
import { TRPCError } from "@trpc/server";
import { createUpdateSchema } from "drizzle-zod";
import { isAtLeast } from "~/server/lib/rbac";

const CreateTeamInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const UpdateTeamInputSchema = createUpdateSchema(teams);

export const teamsRouter = createTRPCRouter({
  createTeam: protectedProcedure
    .input(CreateTeamInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role;
      // Only ADMIN or TEAM_MANAGEMENT can create teams
      if (!isAtLeast(userRole, "TEAM_MANAGEMENT")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create teams.",
        });
      }
      const newTeam = await ctx.db
        .insert(teams)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();
      if (!newTeam[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create team",
        });
      }
      return newTeam[0];
    }),

  getTeams: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.teams.findMany({
      orderBy: (teams, { asc }) => [asc(teams.name)],
    });
  }),

  getTeam: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.id),
      });
      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Team with id '${input.id}' not found`,
        });
      }
      return team;
    }),

  updateTeam: protectedProcedure
    .input(UpdateTeamInputSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
        columns: { teamId: true, role: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or not authorized.",
        });
      }
      const { id, ...updateData } = input;

      if (!id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team ID is required for update.",
        });
      }

      if (!ctx.rbac.permissionForStaticResource(id, "update")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update teams.",
        });
      }

      const updatedTeam = await ctx.db
        .update(teams)
        .set(updateData)
        .where(eq(teams.id, id))
        .returning();

      if (!updatedTeam[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to update team with id '${input.id}'. It might not exist or you don't have permission.`,
        });
      }
      return updatedTeam[0];
    }),

  updateSystem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mdx: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const system = await ctx.db.query.systems.findFirst({
        where: eq(systems.id, input.id),
      });

      if (!system) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `System with id '${input.id}' not found.`,
        });
      }

      if (!(await ctx.rbac.permissionForSystem(system.teamId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this system.",
        });
      }

      await ctx.db
        .update(systems)
        .set({
          mdx: input.mdx,
        })
        .where(eq(systems.id, input.id));

      return { message: "System updated successfully." };
    }),

  deleteTeam: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAtLeast(ctx.session.user.role, "TEAM_MANAGEMENT")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete teams.",
        });
      }

      const relatedSystems = await ctx.db.query.systems.findMany({
        where: eq(systems.teamId, input.id),
        columns: { id: true },
      });

      if (relatedSystems.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cannot delete team. It has associated systems. Please delete or reassign them first.",
        });
      }

      const deletedTeam = await ctx.db
        .delete(teams)
        .where(eq(teams.id, input.id))
        .returning({ id: teams.id });

      if (!deletedTeam[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to delete team with id '${input.id}'. It might not exist or you don't have permission.`,
        });
      }
      return { id: deletedTeam[0].id, status: "deleted" };
    }),
});
