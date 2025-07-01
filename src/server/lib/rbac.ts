import type { Session } from "next-auth";
import { db } from "../db";
import { z } from "zod";
import { userRoleEnum } from "../db/schema";

// Enum for User Roles
export const UserRoleSchema = z.enum([
  "APPLICANT",
  "MEMBER",
  "TEAM_MANAGEMENT",
  "ADMIN",
]);

function strEnum<T extends string>(o: T[]) {
  type A = Record<T, number>;
  return o.reduce(
    (res: A, key: keyof A, i) => {
      res[key] = i;
      return res;
    },
    Object.create(null) as A,
  );
}

export const UserRoleEnum = strEnum(userRoleEnum.enumValues);
export type UserRole = keyof typeof UserRoleEnum;

type Action = "any" | "read" | "update" | "delete" | "create";

export class UserRbac {
  private permissions: Record<string, Action[]> = {};

  constructor(private user: Session["user"]) {
    if (user.role === "ADMIN") {
      this.permissions["*"] = ["any"];
    } else if (user.role === "TEAM_MANAGEMENT") {
      this.permissions[user.teamId] = ["any"];
      this.permissions.Users = ["read"];
    } else if (user.role === "MEMBER") {
      this.permissions[user.teamId] = ["read"];
      this.permissions.Users = ["read"];
    }

    this.permissions[user.id] = ["read"];
  }

  public permissionForStaticResource(resource: string, action: Action) {
    if (this.permissions["*"]) return true;

    if (
      this.permissions[resource]?.includes(action) ||
      this.permissions[resource]?.includes("any")
    ) {
      return true;
    }

    return false;
  }

  public async permissionForInterview(id: string) {
    const interview = await db.query.interviews.findFirst({
      where: (interviews, { eq }) => eq(interviews.id, id),
      with: {
        application: true,
      },
    });

    if (!interview) return false;
    if (this.permissions["*"]) return true;
    if (interview.application?.teamId === this.user.teamId) return true;
    return false;
  }

  public async permissionForEditingTeamPage(teamId: string) {
    if (this.permissions["*"]) return true;
    if (this.permissions[teamId]?.includes("any")) return true;
    if (this.permissions[teamId]?.includes("update")) return true;

    return false;
  }

  public permissionForSystem = (teamId: string) =>
    this.permissionForEditingTeamPage(teamId);
}

const rbacCache: Record<string, UserRbac> = {};

export function hasPermission(
  { user }: Session,
  resource: string,
  perm: Action,
) {
  if (!user) return false;

  const rbac = new UserRbac(user);
  rbacCache[user.id] = rbac;

  return rbac.permissionForStaticResource(resource, perm);
}

export function isAtLeast(
  actorRole: UserRole | undefined,
  requiredRole: UserRole,
) {
  return actorRole
    ? UserRoleEnum[actorRole] >= UserRoleEnum[requiredRole]
    : false;
}
