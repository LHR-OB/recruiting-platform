import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { db } from "~/server/db";

const TeamPublicPage = async () => {
  const teams = await db.query.teams.findMany({
    with: {
      systems: true,
    },
  });

  return (
    <>
      <h1 className="text-2xl font-medium">Teams</h1>
      <p className="text-muted-foreground max-w-5xl pb-6">
        Longhorn Racing is composed of three Collegiate Design Series teams.
        Each one specializing in addressing the unique challenges of their
        competition.
      </p>
      <div className="absolute left-0 w-full border-b" />
      {teams.map((team) => {
        return (
          <div key={team.id} className="pt-4">
            <div className="pb-2">
              <h2 className="text-xl font-medium">{team.name}</h2>
            </div>
            {team.image && (
              <Image
                src={team.image}
                width={1920}
                height={1080}
                alt={team.name + " pictured"}
              />
            )}
            <div className="pt-2">
              <p className="text-muted-foreground">{team.description}</p>
              <p className="text-muted-foreground">
                The following systems are recruiting:
              </p>
              <div className="flex flex-col gap-4 pt-2">
                {team.systems.map((system) => (
                  <Link
                    href={"/systems/[systemId]"}
                    as={{
                      pathname: `/systems/${system.id}`,
                    }}
                    key={system.id}
                    className={cn(
                      buttonVariants({
                        variant: "link",
                      }),
                      "w-fit py-2 pl-0",
                    )}
                  >
                    <p className="">
                      {system.name} <br />
                      <span className="text-muted-foreground">
                        {(system.description?.length ?? 0) > 0
                          ? system.description
                          : "No subsystems"}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-12 pb-4">
              <Link
                href="/teams/[teamId]"
                as={`/teams/${team.id}`}
                className={cn(buttonVariants(), "group")}
              >
                Learn more{" "}
                <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="absolute left-0 w-full border-b" />
          </div>
        );
      })}
    </>
  );
};

export default TeamPublicPage;
