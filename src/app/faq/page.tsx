import { db } from "~/server/db";
import { faq } from "~/server/db/schema";
import { notFound } from "next/navigation";
import { Card } from "~/components/ui/card";
import { auth } from "~/server/auth";
import Editor from "../systems/[systemId]/_components/editor";
import ReadOnly from "../teams/[teamId]/_components/read-only";
import { hasPermission, isAtLeast, UserRbac } from "~/server/lib/rbac";
import { generateHTML, generateJSON } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";
import { type JSONContent } from "@tiptap/react";
import { nanoid } from "nanoid";
import FaqEditor from "./_components/faq-editor";
import { unstable_cacheLife } from "next/cache";

async function getFaq() {
  const currFaq = await db.query.faq.findFirst();
  if (!currFaq) {
    const inserted = await db.insert(faq).values({ id: nanoid() }).returning();
    return inserted[0];
  } else {
    return currFaq;
  }
}

export async function generateContent(mdx: string | null) {
  "use cache";
  unstable_cacheLife("minutes");

  if (!mdx) return ["", {} as JSONContent] as const;
  const html = generateHTML(JSON.parse(mdx) as JSONContent, [StarterKit]);
  return [html, generateJSON(html, [StarterKit])] as const;
}

export default async function FaqPage() {
  const session = await auth();
  const faq = await getFaq();
  if (!faq) return notFound();
  const [html, jsonContent] = await generateContent(faq.mdx);

  return (
    <>
      <h1 className="mb-4 text-3xl font-medium">FAQ</h1>
      {session && isAtLeast(session.user.role, "ADMIN") ? (
        <FaqEditor faqId={faq.id} content={jsonContent} />
      ) : (
        <ReadOnly content={html} />
      )}
    </>
  );
}
