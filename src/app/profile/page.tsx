import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { ProfileForm } from "./_components/ProfileForm";
import { db } from "~/server/db";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await db.query.users.findFirst({
    where: (t, { eq }) => eq(t.id, session.user.id),
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and upload your resume.
        </p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <ProfileForm user={session.user} resumeUrl={user.resumeUrl} />
    </>
  );
}
