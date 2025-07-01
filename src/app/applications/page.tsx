import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { hasPermission } from "~/server/lib/rbac";
import { getTeams } from "../people/page";
import { columns, type Application } from "./_components/columns";
import { DataTable } from "./_components/data-table";

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

  // Mock data for now
  const data: Application[] = [
    {
      id: "1",
      data: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      teamId: "1",
      teamName: "Solar",
      userId: "1",
      status: "PENDING",
      systemId: "1",
      applicationCycleId: "1",
      user: {
        id: "1",
        name: "John Doe",
        email: "123@gmail.com",
        emailVerified: new Date(),
        image: "",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
        teamId: "1",
      },
    },
  ];

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
      <div className="absolute left-0 w-full border-b" />
      <div className="pt-4">
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export default Page;
