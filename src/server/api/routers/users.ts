// filepath: /Users/lance/Documents/Coding/recruiting-platform/src/server/api/routers/users.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  users,
  teams,
  systems,
  usersToSystems,
  events,
  usersToEvents,
  userRoleEnum,
} from "~/server/db/schema"; // Added usersToEvents
import { eq, or, sql, and } from "drizzle-orm"; // Added sql for count
import { hasPermission } from "~/server/lib/rbac"; // RBAC import

export const usersRouter = createTRPCRouter({});
