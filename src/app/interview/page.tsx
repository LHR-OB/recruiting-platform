import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { applications, interviews } from "~/server/db/schema";
import { InterviewScheduler } from "./_components/InterviewScheduler";
import { SystemSelector } from "./_components/SystemSelector";
import { ScheduledInterview } from "./_components/ScheduledInterview";

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string; systemId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { applicationId, systemId } = await searchParams;

  if (!applicationId) {
    return notFound();
  }

  const application = await db.query.applications.findFirst({
    where: (t, { eq, and }) =>
      and(
        eq(t.id, applicationId),
        eq(t.status, "NEEDS_REVIEW"),
        eq(t.internalStatus, "INTERVIEW"),
      ),
    with: {
      team: {
        columns: {
          id: true,
          name: true,
        },
      },
      cycle: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    return notFound();
  }

  const { system1, system2, system3 } = application.data as {
    system1?: string;
    system2?: string;
    system3?: string;
  };
  const systems = [system1, system2, system3].filter(Boolean) as string[];

  // Get all systems for the selected application's team
  const teamSystems = await db.query.systems.findMany({
    where: (t, { inArray, and, eq }) =>
      and(
        inArray(t.name, systems.length ? systems : ["bad"]),
        eq(t.teamId, application.team.id),
      ),
    columns: {
      id: true,
      name: true,
      description: true,
    },
  });

  const selectedSystem = teamSystems.find((s) => s.id === systemId) ?? null;

  // Check if user already has interviews scheduled
  const existingInterviews = await db.query.interviews.findMany({
    where: eq(interviews.applicationId, applicationId),
    with: {
      application: {
        with: {
          team: {
            columns: {
              name: true,
            },
          },
          cycle: {
            columns: {
              name: true,
            },
          },
        },
      },
      system: {
        columns: {
          name: true,
        },
      },
    },
  });

  // Check if the current application is for solar system
  let isApplyingToSolar = false;

  if (application.team.name.toLowerCase() === "solar") {
    isApplyingToSolar = true;
  }

  const interviewForCurrentSystem = existingInterviews.find(
    (interview) => interview.systemId === selectedSystem?.id,
  );

  return (
    <main className="py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-medium">Schedule Your Interview</h1>
          <p className="text-muted-foreground mt-2">
            Select a 30-minute time slot for your interview with the{" "}
            {application.team.name} team.
          </p>
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm">
              <div className="font-medium text-blue-800">
                Application: {application.cycle.name}
              </div>
              <div className="mt-1 text-blue-700">
                Team: {application.team.name}
              </div>
              {selectedSystem && (
                <div className="mt-1 text-blue-700">
                  System: {selectedSystem.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {isApplyingToSolar && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Solar System Applicant</div>
              <div className="mt-1">
                As a solar system applicant, you can schedule multiple
                interviews across different solar teams if needed.
              </div>
            </div>
          </div>
        )}

        {/* Show system selector if team has multiple systems */}
        <SystemSelector
          systems={teamSystems}
          selectedSystemId={systemId}
          teamName={application.team.name}
          applicationId={applicationId}
        />

        {selectedSystem && interviewForCurrentSystem === undefined ? (
          <InterviewScheduler
            applicationId={applicationId}
            teamId={application.teamId}
            systemId={selectedSystem.id}
          />
        ) : interviewForCurrentSystem ? (
          <ScheduledInterview
            interview={interviewForCurrentSystem}
            application={application}
            system={selectedSystem}
          />
        ) : null}
      </div>
    </main>
  );
}
