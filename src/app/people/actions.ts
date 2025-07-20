"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { userRoleEnum } from "~/server/db/schema";
import { isAtLeast, type UserRole } from "~/server/lib/rbac";

export async function updateUserRoleAndTeam({
  userId,
  role,
  teamId,
  currentUserRole,
  systemId,
}: {
  userId: string;
  role: (typeof userRoleEnum.enumValues)[number];
  teamId: string;
  currentUserRole: UserRole;
  systemId?: string;
}) {
  if (!isAtLeast(role, currentUserRole)) {
    throw new Error("Insufficient permissions to update user role");
  }

  await db
    .update(users)
    .set({ role, teamId, systemId })
    .where(eq(users.id, userId));
  return { success: true };
}
