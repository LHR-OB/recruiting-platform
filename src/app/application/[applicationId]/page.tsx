"use server";

import { notFound } from "next/navigation";
import { db } from "~/server/db";
import ApplicationForm from "./_components/application-form";
import { auth } from "~/server/auth";
import { applications } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Rejected from "./_components/rejected";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

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
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          resumeUrl: true,
          eidEmailVerified: true,
        },
      },
      cycle: true,
    },
  });

  if (!application) return notFound();

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
      {application.cycle.stage === "APPLICATION" && (
        <ApplicationForm
          initial={application.data as object}
          status={application.status}
          teamSystems={application.team.systems}
          disabled={
            application.cycle.stage !== "APPLICATION" ||
            application.status === "NEEDS_REVIEW"
          }
          updateAppAction={async function (json: string) {
            "use server";

            if (
              application.cycle.stage !== "APPLICATION" ||
              application.status === "NEEDS_REVIEW"
            ) {
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

            if (
              application.cycle.stage !== "APPLICATION" ||
              application.status === "NEEDS_REVIEW"
            ) {
              return "Application is not in the correct state to be submitted.";
            }

            if (!application.user.resumeUrl) {
              return "You must upload your resume before submitting your application.";
            }

            if (!application.user.eidEmailVerified) {
              return "You must verify your EID email before submitting your application.";
            }

            const session = await auth();

            if (session?.user.id !== application.userId) return notFound();

            await db
              .update(applications)
              .set({
                status: "NEEDS_REVIEW",
              })
              .where(eq(applications.id, application.id));
          }}
        />
      )}
      {application.cycle.stage !== "APPLICATION" && (
        <div className="pt-4">
          {((application.status !== "ACCEPTED" &&
            application.status !== "NEEDS_REVIEW") ||
            application.cycle.stage !== application.internalStatus) && (
            <Rejected />
          )}
          {application.status === "NEEDS_REVIEW" &&
            application.cycle.stage === application.internalStatus && (
              <div>
                <p>
                  Congratulations on progressing to the next stage of the
                  application process!
                </p>
                <br />
                {application.cycle.stage === "INTERVIEW" && (
                  <>
                    <p>
                      As part of our next stage, we&apos;d like to invite you to
                      interview with us!
                    </p>
                    <p>You may schedule your interview below</p>
                    <Link
                      className={cn(buttonVariants({}), "mt-4")}
                      href={`/interview?applicationId=${application.id}`}
                    >
                      Schedule Interview
                    </Link>
                  </>
                )}
                {application.cycle.stage === "TRAIL" && (
                  <>
                    <p>
                      As part of our next stage, we&apos;d like to invite you to
                      do a mock trial with us!
                    </p>
                  </>
                )}
              </div>
            )}
        </div>
      )}
    </>
  );
};

export default AppPage;
