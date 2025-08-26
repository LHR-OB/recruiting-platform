"use server";

import { db } from "~/server/db";
import {
  applications,
  applicationCycleStatusEnum,
} from "../../server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/server/auth";
import { hasPermission } from "~/server/lib/rbac";

type AppStage = (typeof applicationCycleStatusEnum)["enumValues"][number];

function getNextStage(currentStage: AppStage, cycleStage: AppStage) {
  const e = applicationCycleStatusEnum.enumValues;
  const cycleI = e.indexOf(cycleStage);
  const i = e.indexOf(currentStage);
  if (i >= cycleI && cycleI + 1 < e.length) {
    return e[cycleI + 1];
  }

  return e[i + 1 < e.length ? i + 1 : i]!;
}

export const setApplicantStage = async (
  applicationId: string,
  stage: AppStage,
) => {
  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  await db
    .update(applications)
    .set({
      internalStatus: stage,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
};

export const setApplicantDecision = async (
  applicationId: string,
  decision: "ACCEPTED" | "REJECTED",
) => {
  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  await db
    .update(applications)
    .set({
      internalDecision: decision,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
};

export const rejectApplicant = async (applicationId: string) => {
  "use server";

  const application = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
  });

  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  if (!application) {
    return "Application not found";
  }

  await db
    .update(applications)
    .set({
      internalDecision: "REJECTED",
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
};

export async function moveApplicantToNextStage(applicationId: string) {
  "use server";

  const application = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
    with: {
      cycle: true,
    },
  });

  if (!application) {
    return "Application not found";
  }

  const nextStage = getNextStage(
    application.internalStatus,
    application.cycle.stage,
  );

  await setApplicantStage(applicationId, nextStage);

  return nextStage;
}

export async function waitlistApplicant(applicationId: string) {
  "use server";

  const application = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
  });

  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  if (!application) {
    return "Application not found";
  }

  await db
    .update(applications)
    .set({
      internalDecision: "WAITLISTED",
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
}
