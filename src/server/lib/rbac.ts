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

function strEnum<T extends string>(o: readonly T[]) {
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

const Action = ["read", "update", "create", "delete", "any"] as const;
const ActionValue = strEnum(Action);
type Action = (typeof Action)[number];
export class UserRbac {
  private permissions: Record<string, Action> = {};

  constructor(private user: Session["user"]) {
    if (user.role === "ADMIN") {
      this.permissions["*"] = "any";
    } else if (user.role === "TEAM_MANAGEMENT") {
      this.permissions[user.teamId] = "any";
      this.permissions["*system"] = "any";
      this.permissions.Users = "read";
    } else if (user.role === "SYSTEM_LEADER") {
      this.permissions[user.teamId] = "read";
      this.permissions[user.systemId ?? "bad"] = "update";
      this.permissions.Users = "read";
    } else if (user.role === "MEMBER") {
      this.permissions[user.teamId] = "read";
      this.permissions[user.systemId ?? "bad"] = "read";
    }

    if (user.role !== "APPLICANT" && user.role !== "ADMIN") {
      this.permissions.Users = "read";
    }

    this.permissions[user.id] = "update";
  }

  public permissionForStaticResource(
    resource: string | undefined,
    action: Action,
  ) {
    if (!resource) return false;

    // total access
    if (this.permissions["*"]) return true;

    if (resource === "*system" && this.permissions["*system"]) {
      return ActionValue[this.permissions["*system"]] >= ActionValue[action];
    }

    if (
      this.permissions[resource] &&
      ActionValue[this.permissions[resource]] >= ActionValue[action]
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
}

const rbacCache: Record<string, UserRbac> = {};

export function hasPermission(
  { user }: Session,
  resource: string | undefined,
  perm: Action,
) {
  if (!user || !resource) return false;

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
