import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { hasPermission, isAtLeast } from "~/server/lib/rbac";
import { getSystems, getTeams } from "../people/page";
import { columns, type Application } from "./_components/columns";
import { DataTable } from "./_components/data-table";
import { db } from "~/server/db";

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
    where: (applications, { eq, and }) =>
      and(
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
        },
      },
      team: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!isAtLeast(session.user.role, "ADMIN")) {
    data = data.filter((app) => app.teamId === session.user.teamId);
  }

  console.log(data);

  if (!isAtLeast(session.user.role, "TEAM_MANAGEMENT")) {
    data = data.filter((app) =>
      [
        app.data?.system1 ?? "-1",
        app.data?.system2 ?? "-1",
        app.data?.system3 ?? "-1",
      ].includes(session.user.systemId),
    );
  }

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
        <DataTable
          columns={columns}
          data={data.map((app) => ({ ...app, teamName: app.team.name }))}
        />
      </div>
    </>
  );
};

export default Page;
