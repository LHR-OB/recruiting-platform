import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { interviewNotes, interviews, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "~/server/api/routers/users";

// RBAC permissions for interview notes
export type InterviewNotePermission =
  | "interview_note:create"
  | "interview_note:read:any"
  | "interview_note:read:self"
  | "interview_note:update:any"
  | "interview_note:update:self"
  | "interview_note:delete:any"
  | "interview_note:delete:self";

const interviewNoteRolePermissions = {
  ADMIN: [
    "interview_note:create",
    "interview_note:read:any",
    "interview_note:update:any",
    "interview_note:delete:any",
    "interview_note:read:self",
    "interview_note:update:self",
    "interview_note:delete:self",
  ],
  TEAM_MANAGEMENT: [
    "interview_note:create",
    "interview_note:read:any",
    "interview_note:update:self",
    "interview_note:delete:self",
    "interview_note:read:self",
  ],
  MEMBER: [
    "interview_note:read:self",
    "interview_note:update:self",
    "interview_note:delete:self",
  ],
  APPLICANT: [
    "interview_note:create",
    "interview_note:read:self",
    "interview_note:update:self",
    "interview_note:delete:self",
  ],
};

function hasInterviewNotePermission(
  role: UserRole,
  permission: InterviewNotePermission,
  actorId: string,
  targetUserId?: string,
): boolean {
  const perms = interviewNoteRolePermissions[role] ?? [];
  if (!perms.includes(permission)) return false;
  if (permission.endsWith(":self")) {
    return actorId === targetUserId;
  }
  return true;
}

export const interviewNotesRouter = createTRPCRouter({
  createInterviewNote: protectedProcedure
    .input(z.object({ interviewId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      if (
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:create",
          actor.id,
          actor.id,
        )
      )
        throw new Error("Not authorized");
      const result = await ctx.db
        .insert(interviewNotes)
        .values({
          interviewId: input.interviewId,
          note: input.note,
          createdById: actor.id,
        })
        .returning();
      return result[0];
    }),

  getInterviewNotes: protectedProcedure.query(async ({ ctx }) => {
    const actor = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    if (!actor) throw new Error("Not authenticated");
    if (
      !hasInterviewNotePermission(
        actor.role,
        "interview_note:read:any",
        actor.id,
        undefined,
      )
    )
      throw new Error("Not authorized");
    return ctx.db.query.interviewNotes.findMany();
  }),

  getInterviewNote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const note = await ctx.db.query.interviewNotes.findFirst({
        where: eq(interviewNotes.id, input.id),
      });
      if (!note) throw new Error("Not found");
      if (
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:read:any",
          actor.id,
          note.createdById,
        ) &&
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:read:self",
          actor.id,
          note.createdById,
        )
      )
        throw new Error("Not authorized");
      return note;
    }),

  getInterviewNotesByInterview: protectedProcedure
    .input(z.object({ interviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      // Only allow if can read any note
      if (
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:read:any",
          actor.id,
          undefined,
        )
      )
        throw new Error("Not authorized");
      return ctx.db.query.interviewNotes.findMany({
        where: eq(interviewNotes.interviewId, input.interviewId),
      });
    }),

  updateInterviewNote: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({ note: z.string().optional() }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const note = await ctx.db.query.interviewNotes.findFirst({
        where: eq(interviewNotes.id, input.id),
      });
      if (!note) throw new Error("Not found");
      if (
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:update:any",
          actor.id,
          note.createdById,
        ) &&
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:update:self",
          actor.id,
          note.createdById,
        )
      )
        throw new Error("Not authorized");
      const updated = await ctx.db
        .update(interviewNotes)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(interviewNotes.id, input.id))
        .returning();
      return updated[0];
    }),

  deleteInterviewNote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });
      if (!actor) throw new Error("Not authenticated");
      const note = await ctx.db.query.interviewNotes.findFirst({
        where: eq(interviewNotes.id, input.id),
      });
      if (!note) throw new Error("Not found");
      if (
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:delete:any",
          actor.id,
          note.createdById,
        ) &&
        !hasInterviewNotePermission(
          actor.role,
          "interview_note:delete:self",
          actor.id,
          note.createdById,
        )
      )
        throw new Error("Not authorized");
      await ctx.db
        .delete(interviewNotes)
        .where(eq(interviewNotes.id, input.id));
      return { success: true };
    }),
});
