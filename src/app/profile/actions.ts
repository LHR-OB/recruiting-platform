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
    return {
      success: false,
      error:
        "Invalid form data. Email must end with eid.utexas.edu, and phone number must be valid",
    };
  }

  const { name, email, phoneNumber } = validatedFields.data;

  if (!email.endsWith("eid.utexas.edu")) {
    return { success: false, error: "Email must end with @eid.utexas.edu" };
  }

  const needsToRevalidateEmail = !!(email && session.user.eidEmail !== email);
  if (email && session.user.eidEmail !== email) {
    await db
      .update(users)
      .set({
        eidEmail: email,
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
  return { success: true, needsToRevalidateEmail };
}
