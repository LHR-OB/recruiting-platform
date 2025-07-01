"use client";

import { ContrastIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";

const Footer = () => {
  const { resolvedTheme, setTheme } = useTheme();
  console.log("Current theme:", resolvedTheme);

  return (
    <>
      <div className="w-full border-b" />
      <footer className="text-muted-foreground container mx-auto flex items-center justify-between py-4">
        <p>© 2025 Longhorn Racing</p>
        <Button
          variant="ghost"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <ContrastIcon />
        </Button>
      </footer>
    </>
  );
};

export default Footer;
