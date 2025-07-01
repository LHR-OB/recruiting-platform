import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { systems } from "~/server/db/schema";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Image from "next/image";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { type JSONContent } from "@tiptap/react";
import Editor from "./_components/editor";
import { hasPermission, UserRbac } from "~/server/lib/rbac";
import ReadOnly from "~/app/teams/[teamId]/_components/read-only";

export default async function SystemPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const session = await auth();

  if (!session) {
    return notFound();
  }

  const rbac = new UserRbac(session.user);
  const { systemId } = await params;
  const system = await db.query.systems.findFirst({
    where: eq(systems.id, systemId),
    with: {
      team: {
        with: {
          users: true,
        },
      },
    },
  });

  if (!system) {
    return notFound();
  }

  const isTeamMember = system.team.users.some(
    (user) => user.id === session?.user.id,
  );

  const content = system.mdx
    ? generateHTML(JSON.parse(system.mdx) as JSONContent, [StarterKit])
    : null;

  console.log(await rbac.permissionForSystem(systemId));

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">{system.name}</h1>
        <p className="text-muted-foreground">{system.description}</p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="pt-4">
        {(session && (await rbac.permissionForSystem(session.user.teamId)) && (
          <Editor
            systemId={systemId}
            // stinks
            content={(content as unknown as JSONContent) ?? ({} as JSONContent)}
          />
        )) ?? <ReadOnly content={content ?? ""} />}
      </div>
    </>
  );
}
