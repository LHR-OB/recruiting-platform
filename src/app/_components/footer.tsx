"use client";

import { ContrastIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";

import { signOutAction } from "./actions";

const Footer = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <div className="w-full border-b" />
      <footer className="text-muted-foreground container mx-auto flex items-center justify-between py-2">
        <p className="text-sm">© 2025 Longhorn Racing</p>
        <div className="flex gap-2">
          <Button variant="link" className="text-muted-foreground"
            onClick={() => signOutAction()}
          >
            Sign Out
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <ContrastIcon />
          </Button>>
        </div>
      </footer>
    </>
  );
};

export default Footer;
