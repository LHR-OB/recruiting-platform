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
  systemStatuses: Record<string, string>,
) => {
  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  await db
    .update(applications)
    .set({
      updatedAt: new Date(),
      systemStatuses: {
        ...systemStatuses,
        [session.user.systemId!]: stage,
      },
    })
    .where(eq(applications.id, applicationId));
};

export const setApplicantDecision = async (
  applicationId: string,
  decision: "ACCEPTED" | "REJECTED",
  systemDecisions: Record<string, string>,
) => {
  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  const app = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
  });

  if (!app) {
    return "Application not found";
  }

  await db
    .update(applications)
    .set({
      updatedAt: new Date(),
      systemDecisions: {
        ...systemDecisions,
        [session.user.systemId!]: decision,
      },
    })
    .where(eq(applications.id, applicationId));
};

export const setApplicationColor = async (
  applicationId: string,
  highlightColor: string | null,
) => {
  "use server";

  const session = await auth();

  if (!session || !hasPermission(session, "*application", "update")) {
    return "User does not have permission to update applications";
  }

  const app = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
  });

  if (!app) {
    return "Application not found";
  }

  await db
    .update(applications)
    .set({
      updatedAt: new Date(),
      highlightColor,
    })
    .where(eq(applications.id, applicationId));
};

export const rejectApplicant = async (
  applicationId: string,
  systemId: string,
) => {
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

  if (!application.rejectedFrom.includes(systemId)) {
    if (application.rejectedFrom.length + 1 >= 3) {
      await db
        .update(applications)
        .set({
          internalDecision: "REJECTED",
          updatedAt: new Date(),
          rejectedFrom: [...application.rejectedFrom, systemId],
        })
        .where(eq(applications.id, applicationId));
    } else {
      await db
        .update(applications)
        .set({
          rejectedFrom: [...application.rejectedFrom, systemId],
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));
    }
  } else {
    return "System already in rejected list";
  }
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

  await setApplicantStage(
    applicationId,
    nextStage!,
    application.systemStatuses,
  );

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
