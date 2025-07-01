import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  interviews,
  interviewNotes,
  users,
  events,
  applications,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "~/server/lib/rbac";
import type { UserRole } from "~/server/api/routers/users";

// RBAC permissions for interviews
export type InterviewPermission =
  | "interview:create"
  | "interview:read:any"
  | "interview:read:self"
  | "interview:update:any"
  | "interview:update:self"
  | "interview:delete:any"
  | "interview:delete:self";

const interviewRolePermissions = {
  ADMIN: [
    "interview:create",
    "interview:read:any",
    "interview:update:any",
    "interview:delete:any",
    "interview:read:self",
    "interview:update:self",
    "interview:delete:self",
  ],
  TEAM_MANAGEMENT: [
    "interview:create",
    "interview:read:any",
    "interview:update:self",
    "interview:delete:self",
    "interview:read:self",
  ],
  MEMBER: [
    "interview:read:self",
    "interview:update:self",
    "interview:delete:self",
  ],
  APPLICANT: [
    "interview:create",
    "interview:read:self",
    "interview:update:self",
    "interview:delete:self",
  ],
};

function hasInterviewPermission(
  role: UserRole,
  permission: InterviewPermission,
  actorId: string,
  targetUserId?: string,
): boolean {
  const perms = interviewRolePermissions[role] ?? [];
  if (!perms.includes(permission)) return false;
  if (permission.endsWith(":self")) {
    return actorId === targetUserId;
  }
  return true;
}

export const interviewsRouter = createTRPCRouter({
  createInterview: protectedProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        applicationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasInterviewPermission(
          actor.role,
          "interview:create",
          actor.id,
          actor.id,
        )
      )
        throw new Error("Not authorized");
      const result = await ctx.db
        .insert(interviews)
        .values({
          eventId: input.eventId,
          applicationId: input.applicationId,
          createdById: actor.id,
        })
        .returning();
      return result[0];
    }),

  getInterviews: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor) throw new Error("Not authenticated");
    if (
      !hasInterviewPermission(
        actor.role,
        "interview:read:any",
        actor.id,
        undefined,
      )
    )
      throw new Error("Not authorized");
    return ctx.db.query.interviews.findMany();
  }),

  getInterview: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const interview = await ctx.db.query.interviews.findFirst({
        where: eq(interviews.id, input.id),
      });
      if (!interview) throw new Error("Not found");
      if (
        !hasInterviewPermission(
          actor.role,
          "interview:read:any",
          actor.id,
          interview.createdById,
        ) &&
        !hasInterviewPermission(
          actor.role,
          "interview:read:self",
          actor.id,
          interview.createdById,
        )
      )
        throw new Error("Not authorized");
      return interview;
    }),

  getInterviewsByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasInterviewPermission(
          actor.role,
          "interview:read:any",
          actor.id,
          input.userId,
        ) &&
        !hasInterviewPermission(
          actor.role,
          "interview:read:self",
          actor.id,
          input.userId,
        )
      )
        throw new Error("Not authorized");
      return ctx.db.query.interviews.findMany({
        where: eq(interviews.createdById, input.userId),
      });
    }),

  updateInterview: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          eventId: z.string().optional(),
          applicationId: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const interview = await ctx.db.query.interviews.findFirst({
        where: eq(interviews.id, input.id),
      });
      if (!interview) throw new Error("Not found");
      if (
        !hasInterviewPermission(
          actor.role,
          "interview:update:any",
          actor.id,
          interview.createdById,
        ) &&
        !hasInterviewPermission(
          actor.role,
          "interview:update:self",
          actor.id,
          interview.createdById,
        )
      )
        throw new Error("Not authorized");
      const updated = await ctx.db
        .update(interviews)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(interviews.id, input.id))
        .returning();
      return updated[0];
    }),

  deleteInterview: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const interview = await ctx.db.query.interviews.findFirst({
        where: eq(interviews.id, input.id),
      });
      if (!interview) throw new Error("Not found");
      if (
        !hasInterviewPermission(
          actor.role,
          "interview:delete:any",
          actor.id,
          interview.createdById,
        ) &&
        !hasInterviewPermission(
          actor.role,
          "interview:delete:self",
          actor.id,
          interview.createdById,
        )
      )
        throw new Error("Not authorized");
      await ctx.db.delete(interviews).where(eq(interviews.id, input.id));
      return { success: true };
    }),
});
