import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

import Editor from "./_components/editor";
import { hasPermission } from "~/server/lib/rbac";
import ReadOnly from "./_components/read-only";
import { type JSONContent } from "@tiptap/react";

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

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

  let content: string;
  try {
    content = generateHTML(JSON.parse(team.mdx ?? "{}") as JSONContent, [
      StarterKit,
    ]);
  } catch {
    content = "";
  }

  return (
    <>
      <h1 className="text-2xl font-medium">{team?.name}</h1>
      {(session && hasPermission(session, teamId, "update") && (
        <Editor
          teamId={teamId}
          // stinks
          content={(content as unknown as JSONContent) ?? ({} as JSONContent)}
        />
      )) ?? <ReadOnly content={content} />}
    </>
  );
};

export default TeamPage;
