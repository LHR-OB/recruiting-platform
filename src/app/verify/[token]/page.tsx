import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { emailVerifications, users } from "~/server/db/schema";

const VerifyPage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;

  const verificationEmail = await db.query.emailVerifications.findFirst({
    where: (t, { eq }) => eq(t.token, token),
  });

  if (!verificationEmail) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Verify Email</h1>
        <p className="text-muted-foreground">
          The verification link is invalid or has already been used.
        </p>
      </div>
    );
  }

  if (verificationEmail.expires <= new Date()) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Verify Email</h1>
        <p className="text-muted-foreground">
          The verification link has expired. Please request a new verification
          email.
        </p>
      </div>
    );
  }

  await db
    .update(users)
    .set({
      eidEmailVerified: true,
    })
    .where(eq(users.id, verificationEmail.userId));

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.token, token));

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Verify Email</h1>
        <p className="text-muted-foreground">
          Success! Your eid email has been verified.
        </p>
      </div>
    </>
  );
};

export default VerifyPage;
