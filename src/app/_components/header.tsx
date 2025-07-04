"use server";

import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { auth, signIn } from "~/server/auth";
import SignInDialog from "./sign-in-dialog";
import { isAtLeast } from "~/server/lib/rbac";

const defaultLinks = {
  LHR: "/",
  Application: "/application",
  // Events: "/events",
  Teams: "/teams/public",
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
  Admin: "/admin",
};

async function signInAction() {
  "use server";

  await signIn("google");
}

const Header = async () => {
  const session = await auth();

  return (
    <div className="w-full border-b">
      <header className="container mx-auto flex py-2">
        <nav className="flex w-full justify-between">
          <div className="flex gap-1">
            {Object.entries(defaultLinks).map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={cn(buttonVariants({ variant: "link" }))}
              >
                {name}
              </Link>
            ))}
            {isAtLeast(session?.user.role, "MEMBER") &&
              Object.entries(memberLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(buttonVariants({ variant: "link" }))}
                >
                  {name}
                </Link>
              ))}
            {isAtLeast(session?.user.role, "TEAM_MANAGEMENT") &&
              Object.entries(managementLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(buttonVariants({ variant: "link" }))}
                >
                  {name}
                </Link>
              ))}
            {isAtLeast(session?.user.role, "ADMIN") &&
              Object.entries(adminLinks).map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(buttonVariants({ variant: "link" }))}
                >
                  {name}
                </Link>
              ))}
          </div>
          <div>
            {session ? (
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: "link" }))}
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
