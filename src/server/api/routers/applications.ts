import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  applications,
  applicationCycles,
  users,
  teams,
  systems,
} from "~/server/db/schema";
import { eq, and, type InferSelectModel } from "drizzle-orm";
import { hasPermission } from "~/server/lib/rbac";
import type { schema } from "~/server/db";

export const applicationsRouter = createTRPCRouter({
  // Application Cycles
  createApplicationCycle: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        stage: z
          .string()
          .transform(
            (val) =>
              val as InferSelectModel<
                (typeof schema)["applicationCycles"]
              >["stage"],
          ),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only ADMIN
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
      const result = await ctx.db
        .insert(applicationCycles)
        .values(input)
        .returning();
      return result[0];
    }),

  getApplicationCycles: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
    return ctx.db.query.applicationCycles.findMany();
  }),

  getApplicationCycleActive: protectedProcedure.query(async ({ ctx }) => {
    // Any authenticated user
    return ctx.db.query.applicationCycles.findFirst({
      where: eq(applicationCycles.stage, "APPLICATION"),
    });
  }),

  updateApplicationCycle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          stage: z
            .string()
            .transform(
              (val) =>
                val as InferSelectModel<
                  (typeof schema)["applicationCycles"]
                >["stage"],
            )
            .optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
      const updated = await ctx.db
        .update(applicationCycles)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(applicationCycles.id, input.id))
        .returning();
      if (!updated[0]) throw new Error("Not found");
      return updated[0];
    }),

  advanceApplicationCycle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
      // For demo, just set stage to INTERVIEW
      const updated = await ctx.db
        .update(applicationCycles)
        .set({ stage: "INTERVIEW", updatedAt: new Date() })
        .where(eq(applicationCycles.id, input.id))
        .returning();
      if (!updated[0]) throw new Error("Not found");
      return updated[0];
    }),

  deleteApplicationCycle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
      await ctx.db
        .delete(applicationCycles)
        .where(eq(applicationCycles.id, input.id));
      return { success: true };
    }),

  // Applications
  createApplication: protectedProcedure
    .input(
      z.object({ teamId: z.string(), systemId: z.string(), data: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only APPLICANT can create
      if (actor.role !== "APPLICANT") throw new Error("Not authorized");
      // Only allow if active cycle and not already applied
      const currCycle = await ctx.db.query.applicationCycles.findFirst({
        where: eq(applicationCycles.stage, "APPLICATION"),
      });
      if (!currCycle) throw new Error("No active application cycle");
      const existing = await ctx.db.query.applications.findFirst({
        where: and(
          eq(applications.userId, actor.id),
          eq(applications.applicationCycleId, currCycle.id),
          eq(applications.teamId, input.teamId),
          eq(applications.systemId, input.systemId),
        ),
      });
      if (existing) throw new Error("Application already exists");
      const app = await ctx.db
        .insert(applications)
        .values({
          userId: actor.id,
          teamId: input.teamId,
          systemId: input.systemId,
          applicationCycleId: currCycle.id,
          status: "SUBMITTED",
          data: input.data,
        })
        .returning();
      return app[0];
    }),

  getApplications: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
    return ctx.db.query.applications.findMany();
  }),

  getApplicationsByCycle: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor || actor.role !== "ADMIN") throw new Error("Not authorized");
      return ctx.db.query.applications.findMany({
        where: eq(applications.applicationCycleId, input.cycleId),
      });
    }),

  getApplicationsByTeam: protectedProcedure
    .input(z.object({ cycleId: z.string(), teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only ADMIN or TM for their team
      if (
        actor.role !== "ADMIN" &&
        !(actor.role === "TEAM_MANAGEMENT" && actor.teamId === input.teamId)
      )
        throw new Error("Not authorized");
      return ctx.db.query.applications.findMany({
        where: and(
          eq(applications.applicationCycleId, input.cycleId),
          eq(applications.teamId, input.teamId),
        ),
      });
    }),

  getApplicationsBySystem: protectedProcedure
    .input(
      z.object({
        cycleId: z.string(),
        teamId: z.string(),
        systemId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only ADMIN or TM for their team
      if (
        actor.role !== "ADMIN" &&
        !(actor.role === "TEAM_MANAGEMENT" && actor.teamId === input.teamId)
      )
        throw new Error("Not authorized");
      return ctx.db.query.applications.findMany({
        where: and(
          eq(applications.applicationCycleId, input.cycleId),
          eq(applications.teamId, input.teamId),
          eq(applications.systemId, input.systemId),
        ),
      });
    }),

  getApplicationsByUser: protectedProcedure
    .input(z.object({ cycleId: z.string(), userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only ADMIN or self
      if (actor.role !== "ADMIN" && actor.id !== input.userId)
        throw new Error("Not authorized");
      return ctx.db.query.applications.findMany({
        where: and(
          eq(applications.applicationCycleId, input.cycleId),
          eq(applications.userId, input.userId),
        ),
      });
    }),

  updateApplication: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          status: z.string().optional(),
          data: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const app = await ctx.db.query.applications.findFirst({
        where: eq(applications.id, input.id),
      });
      if (!app) throw new Error("Application not found");
      // Only ADMIN or self
      if (actor.role !== "ADMIN" && actor.id !== app.userId)
        throw new Error("Not authorized");
      const updated = await ctx.db
        .update(applications)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(applications.id, input.id))
        .returning();
      return updated[0];
    }),

  deleteApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const app = await ctx.db.query.applications.findFirst({
        where: eq(applications.id, input.id),
      });
      if (!app) throw new Error("Application not found");
      // Only ADMIN or self
      if (actor.role !== "ADMIN" && actor.id !== app.userId)
        throw new Error("Not authorized");
      await ctx.db.delete(applications).where(eq(applications.id, input.id));
      return { success: true };
    }),
});
