"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { emailVerifications, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { transporter } from "../api/update/route";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Valid email is required")
    .refine((s) => s.endsWith("@eid.utexas.edu")),
  phoneNumber: z.string().max(20, "Phone number must be 20 characters or less"),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid form data: " + validatedFields.error.message);
  }

  const { name, email, phoneNumber } = validatedFields.data;

  if (!email.endsWith("eid.utexas.edu")) {
    throw new Error("Email must end with @eid.utexas.edu");
  }

  if (email && session.user.eidEmail !== email) {
    await db
      .update(users)
      .set({
        eidEmailVerified: false,
      })
      .where(eq(users.id, session.user.id));

    const verificationInsert = await db
      .insert(emailVerifications)
      .values({
        userId: session.user.id,
      })
      .returning();
    const verification = verificationInsert[0]!;

    const mailOptions = {
      from: "Longhorn Racing Recruitment <longhornracingrecruitment@gmail.com>",
      to: email,
      subject: `LHR Recruiting Email Verification`,
      text: `Please verify your email at https://recruiting.longhornracing.org/verify/${verification.token}`,
    };

    await transporter.sendMail(mailOptions);
  }

  try {
    await db
      .update(users)
      .set({
        name,
        email,
        phoneNumber,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("Failed to update profile");
  }
}

export async function uploadResume(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const file = formData.get("resume") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a PDF or Word document.");
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error("File too large. Please upload a file smaller than 10MB.");
  }

  try {
    // TODO: Implement actual file upload logic (e.g., to S3, local storage, etc.)
    // For now, we'll just simulate the upload
    console.log("Uploading resume for user:", session.user.id);
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Store file path/URL in database
    // await db.update(users).set({ resumeUrl: uploadedFileUrl }).where(eq(users.id, session.user.id));

    revalidatePath("/profile");
    return { success: true, message: "Resume uploaded successfully" };
  } catch (error) {
    console.error("Failed to upload resume:", error);
    throw new Error("Failed to upload resume");
  }
}
