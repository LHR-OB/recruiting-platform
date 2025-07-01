"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { userRoleEnum } from "~/server/db/schema";

export async function updateUserRoleAndTeam({
  userId,
  role,
  teamId,
  currentUserRole,
}: {
  userId: string;
  role: (typeof userRoleEnum.enumValues)[number];
  teamId: string;
  currentUserRole: string;
}) {
  // Only ADMIN can assign ADMIN role
  if (role === "ADMIN" && currentUserRole !== "ADMIN") {
    throw new Error("Only admins can assign admin role");
  }
  // Only TEAM_MANAGEMENT or ADMIN can update
  if (!["TEAM_MANAGEMENT", "ADMIN"].includes(currentUserRole)) {
    throw new Error("Unauthorized");
  }
  await db.update(users).set({ role, teamId }).where(eq(users.id, userId));
  return { success: true };
}
