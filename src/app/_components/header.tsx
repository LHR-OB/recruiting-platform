"use server";

import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { auth, signIn } from "~/server/auth";
import SignInDialog from "./sign-in-dialog";
import { isAtLeast } from "~/server/lib/rbac";
import { FileIcon, FileX2Icon, TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const defaultLinks = {
  LHR: "/",
  Teams: "/teams/public",
};

const applicantLinks = {
  Application: "/application",
};

const memberLinks = {
  People: "/people",
  Applications: "/applications",
  Interviews: "/interviews",
};

const managementLinks = {
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

const Header = async () => {
  const session = await auth();

  return (
    <div className="w-full border-b">
      <header className="container mx-auto flex py-2.5">
        <nav className="flex w-full justify-between">
          <div className="flex gap-1">
            {Object.entries(defaultLinks).map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={cn(buttonVariants({ variant: "link", size: "sm" }))}
              >
                {name}
              </Link>
            ))}
            {isAtLeast(session?.user.role, "APPLICANT") &&
              Object.entries(applicantLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                  )}
                >
                  {name}
                </Link>
              ))}
            {isAtLeast(session?.user.role, "MEMBER") &&
              Object.entries(memberLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                  )}
                >
                  {name}
                </Link>
              ))}
            {isAtLeast(session?.user.role, "SYSTEM_LEADER") &&
              Object.entries(managementLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                  )}
                >
                  {name}
                </Link>
              ))}
            {isAtLeast(session?.user.role, "ADMIN") &&
              Object.entries(adminLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                  )}
                >
                  {name}
                </Link>
              ))}
          </div>
          <div className="flex items-center gap-2">
            {session && !session.user.resumeUrl && (
              <Tooltip>
                <TooltipTrigger>
                  <FileX2Icon className="text-amber-400" size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-center text-sm">
                    You have not uploaded a resume.
                    <br /> You cannot submit applications until you upload a
                    resume.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {session && !session.user.eidEmailVerified && (
              <Tooltip>
                <TooltipTrigger>
                  <TriangleAlert className="text-amber-400" size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-center text-sm">
                    Your EID email is not verified.
                    <br /> You cannot submit applications until your email is
                    verified.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {session ? (
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "pl-0",
                )}
              >
                {session.user.name ?? "Profile"}
              </Link>
            ) : (
              <SignInDialog signIn={signInAction} />
            )}
          </div>
        </nav>
      </header>
    </div>
  );
};

export default Header;
