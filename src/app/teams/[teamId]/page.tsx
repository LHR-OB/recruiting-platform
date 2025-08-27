import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

import Editor from "./_components/editor";
import { hasPermission, UserRbac } from "~/server/lib/rbac";
import ReadOnly from "./_components/read-only";
import { type JSONContent } from "@tiptap/react";

import { generateContent } from "~/app/systems/[systemId]/page";

const TeamPage = async ({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) => {
  const { teamId } = await params;
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  });

  if (!team) {
    return notFound();
  }

  const session = await auth();
  const rbac = session ? new UserRbac(session.user) : undefined;

  const html = await generateContent(team.mdx);

  return (
    <>
      <h1 className="text-2xl font-medium">{team?.name}</h1>
      {(rbac?.permissionForEditingTeamPage(teamId) && (
        <Editor teamId={teamId} content={html} />
      )) || <ReadOnly content={html} />}
    </>
  );
};

export default TeamPage;
