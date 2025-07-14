"use client";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

const CreateApplicationOrRedirect = ({
  teamName,
  action,
}: {
  teamName: string;
  action: () => Promise<string | void>;
}) => {
  return (
    <Button
      variant="outline"
      className="group w-72 justify-between"
      onClick={() => action()}
    >
      {teamName} Application
      <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
    </Button>
  );
};

export default CreateApplicationOrRedirect;
