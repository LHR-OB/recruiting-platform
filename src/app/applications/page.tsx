import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { hasPermission } from "~/server/lib/rbac";
import { getTeams } from "../people/page";
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

  const data = await db.query.applications.findMany({
    where: (applications, { eq }) =>
      eq(applications.teamId, session.user.teamId),
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

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          View and manage the applications for the{" "}
          {session.user.role === "ADMIN"
            ? "Longhorn Racing"
            : teamIdToName[session.user.teamId]}{" "}
          team.
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
