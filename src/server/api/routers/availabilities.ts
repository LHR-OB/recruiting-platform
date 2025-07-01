import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { availabilities, users, systems } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "~/server/lib/rbac";
import type { UserRole } from "~/server/api/routers/users";

// Define new permissions for availabilities
export type AvailabilityPermission =
  | "availability:create"
  | "availability:read:any"
  | "availability:read:self"
  | "availability:update:self"
  | "availability:delete:self";

// Map roles to permissions
const availabilityRolePermissions = {
  ADMIN: [
    "availability:create",
    "availability:read:any",
    "availability:read:self",
    "availability:update:self",
    "availability:delete:self",
  ],
  TEAM_MANAGEMENT: [
    "availability:create",
    "availability:read:any",
    "availability:read:self",
    "availability:update:self",
    "availability:delete:self",
  ],
  MEMBER: [
    "availability:create",
    "availability:read:self",
    "availability:update:self",
    "availability:delete:self",
  ],
  APPLICANT: ["availability:read:self"],
};

function hasAvailabilityPermission(
  role: UserRole,
  permission: AvailabilityPermission,
  actorId: string,
  targetUserId?: string,
): boolean {
  const perms = availabilityRolePermissions[role] ?? [];
  if (!perms.includes(permission)) return false;
  if (permission.endsWith(":self")) {
    return actorId === targetUserId;
  }
  return true;
}

export const availabilitiesRouter = createTRPCRouter({
  createAvailability: protectedProcedure
    .input(z.object({ systemId: z.string(), start: z.date(), end: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:create",
          actor.id,
          actor.id,
        )
      )
        throw new Error("Not authorized");
      const result = await ctx.db
        .insert(availabilities)
        .values({
          userId: actor.id,
          systemId: input.systemId,
          start: input.start,
          end: input.end,
        })
        .returning();
      return result[0];
    }),

  setAvailabilities: protectedProcedure
    .input(
      z.array(
        z.object({ systemId: z.string(), start: z.date(), end: z.date() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:create",
          actor.id,
          actor.id,
        )
      )
        throw new Error("Not authorized");
      await ctx.db
        .delete(availabilities)
        .where(eq(availabilities.userId, actor.id));
      for (const a of input) {
        await ctx.db
          .insert(availabilities)
          .values({
            userId: actor.id,
            systemId: a.systemId,
            start: a.start,
            end: a.end,
          });
      }
      return { success: true };
    }),

  getAvailabilities: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor) throw new Error("Not authenticated");
    if (
      !hasAvailabilityPermission(
        actor.role,
        "availability:read:any",
        actor.id,
        undefined,
      )
    )
      throw new Error("Not authorized");
    return ctx.db.query.availabilities.findMany();
  }),

  getAvailability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const a = await ctx.db.query.availabilities.findFirst({
        where: eq(availabilities.id, input.id),
      });
      if (!a) throw new Error("Not found");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:read:any",
          actor.id,
          a.userId,
        ) &&
        !hasAvailabilityPermission(
          actor.role,
          "availability:read:self",
          actor.id,
          a.userId,
        )
      )
        throw new Error("Not authorized");
      return a;
    }),

  getAvailabilitiesByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:read:any",
          actor.id,
          input.userId,
        ) &&
        !hasAvailabilityPermission(
          actor.role,
          "availability:read:self",
          actor.id,
          input.userId,
        )
      )
        throw new Error("Not authorized");
      return ctx.db.query.availabilities.findMany({
        where: eq(availabilities.userId, input.userId),
      });
    }),

  getAvailabilitiesCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor) throw new Error("Not authenticated");
    if (
      !hasAvailabilityPermission(
        actor.role,
        "availability:read:self",
        actor.id,
        actor.id,
      )
    )
      throw new Error("Not authorized");
    return ctx.db.query.availabilities.findMany({
      where: eq(availabilities.userId, actor.id),
    });
  }),

  getAvailabilitiesBySystem: protectedProcedure
    .input(z.object({ systemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:read:any",
          actor.id,
          undefined,
        )
      )
        throw new Error("Not authorized");
      return ctx.db.query.availabilities.findMany({
        where: eq(availabilities.systemId, input.systemId),
      });
    }),

  updateAvailability: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          start: z.date().optional(),
          end: z.date().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const a = await ctx.db.query.availabilities.findFirst({
        where: eq(availabilities.id, input.id),
      });
      if (!a) throw new Error("Not found");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:update:self",
          actor.id,
          a.userId,
        )
      )
        throw new Error("Not authorized");
      const updated = await ctx.db
        .update(availabilities)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(availabilities.id, input.id))
        .returning();
      return updated[0];
    }),

  deleteAvailability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const a = await ctx.db.query.availabilities.findFirst({
        where: eq(availabilities.id, input.id),
      });
      if (!a) throw new Error("Not found");
      if (
        !hasAvailabilityPermission(
          actor.role,
          "availability:delete:self",
          actor.id,
          a.userId,
        )
      )
        throw new Error("Not authorized");
      await ctx.db
        .delete(availabilities)
        .where(eq(availabilities.id, input.id));
      return { success: true };
    }),
});
