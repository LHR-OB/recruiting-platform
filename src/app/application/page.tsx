import { db } from "~/server/db";
import { ApplicationList } from "./_components/ApplicationList";
import { auth } from "~/server/auth";
import { Button, buttonVariants } from "~/components/ui/button";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { getTeams } from "../people/page";

export default async function ApplicationsPage() {
  const user = await auth();

  if (!user) {
    return <div>Please sign in to view applications</div>;
  }

  const cycles = await db.query.applicationCycles.findMany();

  const applications = await db.query.applications.findMany({
    where: (applications, { eq }) => eq(applications.userId, user.user.id),
  });

  const teams = await getTeams();

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          View and manage your applications for the Longhorn Racing team.
        </p>
        <p className="text-muted-foreground">
          {(!cycles.some(
            (cycle) => cycle.stage !== "PREPARATION" && cycle.stage !== "FINAL",
          ) &&
            "We're currently not accepting applications.") ||
            "We are accepting applications."}
        </p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="flex flex-col">
        {cycles.map((cycle) => {
          const openForApplications =
            cycle.stage === "APPLICATION" &&
            cycle.startDate < new Date() &&
            cycle.endDate > new Date();

          return (
            <div key={cycle.id} className="pt-4">
              <div className="flex w-full items-center justify-between py-0.5">
                <div className="flex gap-2">
                  <h2 className="text-lg font-medium">{cycle.name}</h2>
                  <Badge
                    variant={
                      cycle.stage === "APPLICATION" ? "default" : "secondary"
                    }
                  >
                    {cycle.stage === "APPLICATION" ? "Open" : "Closed"}
                  </Badge>
                </div>
                {openForApplications && user.user.role === "APPLICANT" && (
                  <Button>
                    <PlusIcon className="size-4" />
                    New Application
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                {cycle.startDate.toLocaleDateString()} to{" "}
                {cycle.endDate.toLocaleDateString()}
              </p>
              {openForApplications && (
                <>
                  <p className="text-muted-foreground">
                    This cycle is currently open for applications. You can
                    submit a new application or edit your existing applications.
                  </p>
                  <p className="mt-2">The following teams recruiting are:</p>
                  <div className="flex flex-col gap-2 pt-1">
                    {teams.map((team) => (
                      <Link
                        href={"/teams/[teamId]"}
                        as={`/teams/${team.id}`}
                        key={team.id}
                        className={cn(
                          buttonVariants({ variant: "secondary" }),
                          "group w-48 justify-between",
                        )}
                      >
                        {team.name}
                        <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <div className="pt-6" />
              <div className="absolute left-0 w-full border-b" />
            </div>
          );
        })}
      </div>
    </>
  );
}
