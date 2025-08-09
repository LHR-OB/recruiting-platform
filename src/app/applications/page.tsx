import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { hasPermission, isAtLeast, isAtMaximum } from "~/server/lib/rbac";
import { getSystems, getTeams } from "../people/page";
import { columns, type Application } from "./_components/columns";
import { DataTable, Table, TableWithProvider } from "./_components/data-table";
import { db } from "~/server/db";
import { moveApplicantToNextStage } from "./actions";

const Page = async () => {
  const session = await auth();

  if (!session) {
    return notFound();
  }

  if (!hasPermission(session, session.user.teamId, "read")) {
    return notFound();
  }

  const teams = await getTeams();
  const teamIdToName = Object.fromEntries(
    teams.map((team) => [team.id, team.name]),
  );

  const systems = await getSystems();

  let data = await db.query.applications.findMany({
    where: (applications, { eq, and, ne }) =>
      and(
        ne(applications.status, "DRAFT"),
        !isAtLeast(session.user.role, "ADMIN")
          ? eq(applications.teamId, session.user.teamId)
          : undefined,
      ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          resumeUrl: true,
        },
        with: {
          applications: {
            with: {
              team: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      },
      team: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: (applications, { asc, desc }) => [
      asc(applications.internalStatus),
      desc(applications.internalDecision),
      asc(applications.createdAt),
    ],
  });

  if (!isAtLeast(session.user.role, "ADMIN")) {
    data = data.filter((app) => app.teamId === session.user.teamId);
  }

  const currentSystemName = systems[session.user.teamId]?.find(
    (system) => system.id === session.user.systemId,
  )?.name;

  if (isAtMaximum(session.user.role, "SYSTEM_LEADER")) {
    data = data.filter((app) =>
      [
        app.data?.system1 ?? "",
        app.data?.system2 ?? "",
        app.data?.system3 ?? "",
      ].includes(currentSystemName!),
    );
  }

  data = data.map((app) => ({
    ...app,
    otherApplications: app.user.applications.filter(
      (otherApp) =>
        app.applicationCycleId === otherApp.applicationCycleId &&
        app.id !== otherApp.id,
    ),
  }));

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          View and manage the applications for{" "}
          {session.user.role === "ADMIN" && "Longhorn Racing."}
          {session.user.role === "TEAM_MANAGEMENT" &&
            "the " + teamIdToName[session.user.teamId] + " team."}
          {session.user.role === "SYSTEM_LEADER" &&
            systems[session.user.teamId]?.find(
              (system) => system.id === session.user.systemId,
            )?.name + " system."}
        </p>
      </div>
      <div className="absolute left-0 container mx-auto border-b" />
      <div className="h-max pt-4">
        <TableWithProvider columns={columns} data={data} />
      </div>
    </>
  );
};

export default Page;
