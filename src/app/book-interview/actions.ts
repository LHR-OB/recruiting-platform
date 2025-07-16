"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  availabilities,
  applicationCycles,
  users,
  applications,
  interviews,
  systems,
} from "~/server/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

async function checkBookingPermissions() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if we're in the interview stage
  const now = new Date();
  const currentCycle = await db.query.applicationCycles.findFirst({
    where: and(
      eq(applicationCycles.stage, "INTERVIEW"),
      lte(applicationCycles.startDate, now),
      gte(applicationCycles.endDate, now),
    ),
  });

  if (!currentCycle) {
    throw new Error(
      "Interview booking is only available during the interview stage of an active application cycle.",
    );
  }

  // Check if user has a valid application for this cycle
  const userApplication = await db.query.applications.findFirst({
    where: and(
      eq(applications.userId, user.id),
      eq(applications.applicationCycleId, currentCycle.id),
    ),
  });

  if (!userApplication) {
    throw new Error("You must have a valid application to book an interview.");
  }

  return { user, currentCycle, application: userApplication };
}

export async function getBookingAvailabilities() {
  await checkBookingPermissions();

  // Get all availabilities from team management and system leaders
  const allAvailabilities = await db.query.availabilities.findMany({
    with: {
      system: true,
      user: {
        columns: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // Filter to only show availabilities from authorized roles
  const authorizedAvailabilities = allAvailabilities.filter(
    (avail) =>
      avail.user?.role === "TEAM_MANAGEMENT" ||
      avail.user?.role === "SYSTEM_LEADER" ||
      avail.user?.role === "ADMIN",
  );

  return authorizedAvailabilities;
}

export async function getSystems() {
  const { application } = await checkBookingPermissions();

  // Extract system preferences from the application data
  const applicationData = application.data as {
    system1?: string;
    system2?: string;
    system3?: string;
  } | null;

  if (!applicationData) {
    return [];
  }

  const systemNames = [
    applicationData.system1,
    applicationData.system2,
    applicationData.system3,
  ].filter((name): name is string => Boolean(name));

  if (systemNames.length === 0) {
    return [];
  }

  // Get the systems that match the applicant's preferences
  const appliedSystems = await db.query.systems.findMany({
    where: inArray(systems.name, systemNames),
    with: {
      team: true,
    },
  });

  // Business rule: Applicants can only interview for one system,
  // unless they applied for "solar" which is a special exception
  const hasSolar = appliedSystems.some(
    (system) => system.name.toLowerCase() === "solar",
  );

  if (hasSolar) {
    // If they applied for solar, they can interview for all their applied systems
    return appliedSystems;
  } else {
    // Otherwise, they can only interview for their first preference (system1)
    const firstPreferenceSystem = appliedSystems.find(
      (system) => system.name === applicationData.system1,
    );
    return firstPreferenceSystem ? [firstPreferenceSystem] : [];
  }
}

export async function getTeams() {
  const { application } = await checkBookingPermissions();

  // Extract system preferences from the application data
  const applicationData = application.data as {
    system1?: string;
    system2?: string;
    system3?: string;
  } | null;

  if (!applicationData) {
    return [];
  }

  const systemNames = [
    applicationData.system1,
    applicationData.system2,
    applicationData.system3,
  ].filter((name): name is string => Boolean(name));

  if (systemNames.length === 0) {
    return [];
  }

  // Get the systems that match the applicant's preferences
  const appliedSystems = await db.query.systems.findMany({
    where: inArray(systems.name, systemNames),
    with: {
      team: true,
    },
  });

  // Business rule: Applicants can only interview for one system,
  // unless they applied for "solar" which is a special exception
  const hasSolar = appliedSystems.some(
    (system) => system.name.toLowerCase() === "solar",
  );

  let availableSystems;
  if (hasSolar) {
    // If they applied for solar, they can interview for all their applied systems
    availableSystems = appliedSystems;
  } else {
    // Otherwise, they can only interview for their first preference (system1)
    const firstPreferenceSystem = appliedSystems.find(
      (system) => system.name === applicationData.system1,
    );
    availableSystems = firstPreferenceSystem ? [firstPreferenceSystem] : [];
  }

  // Extract unique teams from available systems
  const uniqueTeams = availableSystems
    .map((system) => system.team)
    .filter(
      (team, index, array) =>
        team && array.findIndex((t) => t?.id === team.id) === index,
    )
    .filter(Boolean);

  return uniqueTeams;
}

export async function bookInterview(formData: FormData) {
  const { user, application } = await checkBookingPermissions();

  const availabilityId = formData.get("availabilityId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const date = formData.get("date") as string;

  if (!availabilityId || !startTime || !endTime || !date) {
    throw new Error("All fields are required");
  }

  // Verify the availability exists and is still available
  const availability = await db.query.availabilities.findFirst({
    where: eq(availabilities.id, availabilityId),
    with: {
      system: true,
    },
  });

  if (!availability) {
    throw new Error("Availability slot not found");
  }

  // Validate that the user is allowed to interview for this system
  const allowedSystems = await getSystems();
  const isSystemAllowed = allowedSystems.some(
    (system) => system.id === availability.systemId,
  );

  if (!isSystemAllowed) {
    throw new Error(
      "You are not authorized to book an interview for this system.",
    );
  }

  // Check if there's already an interview booked for this user in this cycle
  const existingInterview = await db.query.interviews.findFirst({
    where: eq(interviews.applicationId, application.id),
  });

  if (existingInterview) {
    throw new Error(
      "You already have an interview scheduled for this application cycle.",
    );
  }

  // Create the interview record
  await db.insert(interviews).values({
    applicationId: application.id,
    eventId: availability.id, // Using availability as event for now
    createdById: user.id,
  });

  revalidatePath("/book-interview");
  redirect("/interviews");
}
