"use server";

import { notFound } from "next/navigation";
import { db } from "~/server/db";
import ApplicationForm from "./_components/application-form";
import { auth } from "~/server/auth";
import { applications } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const AppPage = async ({
  params,
}: {
  params: Promise<{
    applicationId: string;
  }>;
}) => {
  const { applicationId } = await params;
  const application = await db.query.applications.findFirst({
    where: (t, { eq }) => eq(t.id, applicationId),
    with: {
      team: {
        with: {
          systems: true,
        },
      },
      cycle: true,
    },
  });

  if (!application) return notFound();

  console.log(application.cycle.stage !== "APPLICATION");

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">
          Your {application.team.name} Application
        </h1>
        <p className="text-muted-foreground">
          View and manage your application for the {application.team.name} team.
          You can edit your application details, upload documents, and submit
          your application.
        </p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <ApplicationForm
        initial={application.data as object}
        status={application.status}
        teamSystems={application.team.systems}
        disabled={application.cycle.stage !== "APPLICATION"}
        updateAppAction={async function (json: string) {
          "use server";

          if (application.cycle.stage !== "APPLICATION") {
            return;
          }

          const session = await auth();

          if (session?.user.id !== application.userId) return notFound();

          await db
            .update(applications)
            .set({
              data: json,
            })
            .where(eq(applications.id, application.id));
        }}
        submitApplication={async function () {
          "use server";

          if (application.cycle.stage !== "APPLICATION") {
            return;
          }

          const session = await auth();

          if (session?.user.id !== application.userId) return notFound();

          await db
            .update(applications)
            .set({
              status: "SUBMITTED",
            })
            .where(eq(applications.id, application.id));
        }}
      />
    </>
  );
};

export default AppPage;
