"use server";

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { teams, systems } from "~/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "~/server/auth";
import { hasPermission } from "~/server/lib/rbac";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required."),
  description: z.string().optional(),
});

export async function createTeam(
  state: {
    errors?: { name?: string[]; description?: string[] };
    message?: string;
  },
  formData: FormData,
) {
  const session = await auth();

  if (!session) return { message: "You must be logged in to create a team." };

  if (!hasPermission(session, session.user.teamId, "update"))
    return {
      message: "You do not have permission to create a team.",
    };

  const validatedFields = createTeamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to create team. Please check the fields.",
    };
  }

  try {
    await db.insert(teams).values({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
    });

    revalidatePath("/teams");
    return { message: "Team created successfully." };
  } catch {
    return { message: "Failed to create team." };
  }
}

const editTeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Team name is required."),
  description: z.string().optional(),
});

export async function editTeam(
  state: {
    errors?: { id?: string[]; name?: string[]; description?: string[] };
    message?: string;
  },
  formData: FormData,
) {
  const session = await auth();

  if (!session) return { message: "You must be logged in to edit a team." };

  const teamId = formData.get("id");
  if (typeof teamId !== "string") {
    return { message: "Invalid team ID." };
  }

  console.log(hasPermission(session, teamId, "update"));

  if (!hasPermission(session, teamId, "update"))
    return {
      message: "You do not have permission to edit this team.",
    };

  const validatedFields = editTeamSchema.safeParse({
    id: teamId,
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to edit team. Please check the fields.",
    };
  }

  try {
    await db
      .update(teams)
      .set({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
      })
      .where(eq(teams.id, validatedFields.data.id));

    revalidatePath("/teams");
    return { message: "Team updated successfully." };
  } catch {
    return { message: "Failed to update team." };
  }
}

const addSystemSchema = z.object({
  name: z.string().min(1, "System name is required."),
  description: z.string().optional(),
  teamId: z.string(),
});

export async function addSystem(
  state: {
    errors?: { name?: string[]; description?: string[]; teamId?: string[] };
    message?: string;
  },
  formData: FormData,
) {
  const session = await auth();

  if (!session) return { message: "You must be logged in to add a system." };
  if (!hasPermission(session, session.user.teamId, "update"))
    return {
      message: "You do not have permission to add a system.",
    };

  const validatedFields = addSystemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    teamId: formData.get("teamId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to add system. Please check the fields.",
    };
  }

  try {
    await db.insert(systems).values({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      teamId: validatedFields.data.teamId,
    });

    revalidatePath("/teams");
    return { message: "System added successfully." };
  } catch {
    return { message: "Failed to add system." };
  }
}

const editSystemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "System name is required."),
  description: z.string().optional(),
});

export async function editSystem(
  state: {
    errors?: { id?: string[]; name?: string[]; description?: string[] };
    message?: string;
  },
  formData: FormData,
) {
  const session = await auth();

  if (!session) return { message: "You must be logged in to edit a system." };

  const systemId = formData.get("id");
  if (typeof systemId !== "string") {
    return { message: "Invalid system ID." };
  }

  const system = await db.query.systems.findFirst({
    where: eq(systems.id, systemId),
  });

  if (!system) {
    return { message: "System not found." };
  }

  if (!hasPermission(session, system.teamId, "update")) {
    return {
      message: "You do not have permission to edit this system.",
    };
  }

  const validatedFields = editSystemSchema.safeParse({
    id: systemId,
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to edit system. Please check the fields.",
    };
  }

  try {
    await db
      .update(systems)
      .set({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
      })
      .where(eq(systems.id, validatedFields.data.id));

    revalidatePath("/teams");
    return { message: "System updated successfully." };
  } catch {
    return { message: "Failed to update system." };
  }
}
