"use server";

import { auth, signIn } from "~/server/auth";
import type { Session } from "next-auth";
import dynamic from "next/dynamic";
import { isAtLeast } from "~/server/lib/rbac";

import HeaderClient from "./header-client";

const defaultLinks = {
  LHR: "/",
  Teams: "/teams/public",
  FAQ: "/faq",
};
const applicantLinks = {
  Application: "/application",
};
const memberLinks = {
  Applications: "/applications",
  Interviews: "/interviews",
};
const managementLinks = {
  People: "/people",
  "Team Management": "/teams",
};
const adminLinks = {
  Cycles: "/cycles",
  Blacklist: "/admin/blacklist",
};

async function signInAction() {
  "use server";
  await signIn("google");
}

const getLinksForSession = (session: Session | null) => {
  let links = { ...defaultLinks };
  if (isAtLeast(session?.user?.role, "APPLICANT")) {
    links = { ...links, ...applicantLinks };
  }
  if (isAtLeast(session?.user?.role, "MEMBER")) {
    links = { ...links, ...memberLinks };
  }
  if (isAtLeast(session?.user?.role, "SYSTEM_LEADER")) {
    links = { ...links, ...managementLinks };
  }
  if (isAtLeast(session?.user?.role, "ADMIN")) {
    links = { ...links, ...adminLinks };
  }
  return links;
};

const Header = async () => {
  const session: Session | null = await auth();
  const links = getLinksForSession(session);
  return (
    <HeaderClient session={session} signInAction={signInAction} links={links} />
  );
};

export default Header;
