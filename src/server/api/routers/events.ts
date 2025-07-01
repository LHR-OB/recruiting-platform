import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { events, users, usersToEvents } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { UserRole } from "~/server/api/routers/users";

// RBAC permissions for events
export type EventPermission =
  | "event:create"
  | "event:read:any"
  | "event:read:self"
  | "event:update:any"
  | "event:update:self"
  | "event:delete:any"
  | "event:delete:self"
  | "event:join"
  | "event:leave"
  | "event:add_user"
  | "event:remove_user";

const eventRolePermissions = {
  ADMIN: [
    "event:create",
    "event:read:any",
    "event:update:any",
    "event:delete:any",
    "event:read:self",
    "event:update:self",
    "event:delete:self",
    "event:join",
    "event:leave",
    "event:add_user",
    "event:remove_user",
  ],
  TEAM_MANAGEMENT: [
    "event:create",
    "event:read:any",
    "event:update:self",
    "event:delete:self",
    "event:read:self",
    "event:join",
    "event:leave",
    "event:add_user",
    "event:remove_user",
  ],
  MEMBER: [
    "event:read:self",
    "event:update:self",
    "event:delete:self",
    "event:join",
    "event:leave",
  ],
  APPLICANT: [
    "event:create",
    "event:read:self",
    "event:update:self",
    "event:delete:self",
    "event:join",
    "event:leave",
  ],
};

function hasEventPermission(
  role: UserRole,
  permission: EventPermission,
  actorId: string,
  targetUserId?: string,
): boolean {
  const perms = eventRolePermissions[role] ?? [];
  if (!perms.includes(permission)) return false;
  if (permission.endsWith(":self")) {
    return actorId === targetUserId;
  }
  return true;
}

export const eventsRouter = createTRPCRouter({
  createEvent: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        startTime: z.date(),
        endTime: z.date(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (!hasEventPermission(actor.role, "event:create", actor.id, actor.id))
        throw new Error("Not authorized");
      const result = await ctx.db
        .insert(events)
        .values({
          name: input.name,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          createdById: actor.id,
        })
        .returning();
      return result[0];
    }),

  getEvents: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor) throw new Error("Not authenticated");
    if (!hasEventPermission(actor.role, "event:read:any", actor.id, undefined))
      throw new Error("Not authorized");
    return ctx.db.query.events.findMany();
  }),

  getEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.id),
      });
      if (!event) throw new Error("Not found");
      if (
        !hasEventPermission(
          actor.role,
          "event:read:any",
          actor.id,
          event.createdById,
        ) &&
        !hasEventPermission(
          actor.role,
          "event:read:self",
          actor.id,
          event.createdById,
        )
      )
        throw new Error("Not authorized");
      return event;
    }),

  getEventsByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasEventPermission(
          actor.role,
          "event:read:any",
          actor.id,
          input.userId,
        ) &&
        !hasEventPermission(
          actor.role,
          "event:read:self",
          actor.id,
          input.userId,
        )
      )
        throw new Error("Not authorized");
      // Find all events joined by user
      const userEvents = await ctx.db.query.usersToEvents.findMany({
        where: eq(usersToEvents.userId, input.userId),
      });
      const eventIds = userEvents.map((ue) => ue.eventId);
      return ctx.db.query.events.findMany({
        where: inArray(events.id, eventIds),
      });
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          location: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.id),
      });
      if (!event) throw new Error("Not found");
      if (
        !hasEventPermission(
          actor.role,
          "event:update:any",
          actor.id,
          event.createdById,
        ) &&
        !hasEventPermission(
          actor.role,
          "event:update:self",
          actor.id,
          event.createdById,
        )
      )
        throw new Error("Not authorized");
      const updated = await ctx.db
        .update(events)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(events.id, input.id))
        .returning();
      return updated[0];
    }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.id),
      });
      if (!event) throw new Error("Not found");
      if (
        !hasEventPermission(
          actor.role,
          "event:delete:any",
          actor.id,
          event.createdById,
        ) &&
        !hasEventPermission(
          actor.role,
          "event:delete:self",
          actor.id,
          event.createdById,
        )
      )
        throw new Error("Not authorized");
      await ctx.db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),

  joinEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (!hasEventPermission(actor.role, "event:join", actor.id, actor.id))
        throw new Error("Not authorized");
      // Check for conflicts (not implemented here)
      await ctx.db
        .insert(usersToEvents)
        .values({ userId: actor.id, eventId: input.id });
      return { success: true };
    }),

  leaveEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (!hasEventPermission(actor.role, "event:leave", actor.id, actor.id))
        throw new Error("Not authorized");
      await ctx.db
        .delete(usersToEvents)
        .where(
          and(
            eq(usersToEvents.userId, actor.id),
            eq(usersToEvents.eventId, input.id),
          ),
        );
      return { success: true };
    }),

  addUserToEvent: protectedProcedure
    .input(z.object({ eventId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasEventPermission(
          actor.role,
          "event:add_user",
          actor.id,
          input.userId,
        )
      )
        throw new Error("Not authorized");
      await ctx.db
        .insert(usersToEvents)
        .values({ userId: input.userId, eventId: input.eventId });
      return { success: true };
    }),

  removeUserFromEvent: protectedProcedure
    .input(z.object({ eventId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasEventPermission(
          actor.role,
          "event:remove_user",
          actor.id,
          input.userId,
        )
      )
        throw new Error("Not authorized");
      await ctx.db
        .delete(usersToEvents)
        .where(
          and(
            eq(usersToEvents.userId, input.userId),
            eq(usersToEvents.eventId, input.eventId),
          ),
        );
      return { success: true };
    }),

  getUsersForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only ADMIN or TEAM_MANAGEMENT can view all users for an event
      if (
        !hasEventPermission(actor.role, "event:read:any", actor.id, undefined)
      )
        throw new Error("Not authorized");
      // Find all users joined to this event
      const userLinks = await ctx.db.query.usersToEvents.findMany({
        where: eq(usersToEvents.eventId, input.eventId),
      });
      const userIds = userLinks.map((ue) => ue.userId);
      if (userIds.length === 0) return [];
      return ctx.db.query.users.findMany({
        where: inArray(users.id, userIds),
      });
    }),
});
