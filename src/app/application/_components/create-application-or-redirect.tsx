"use client";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

const CreateApplicationOrRedirect = ({
  action,
  children,
}: {
  action: () => Promise<string | void>;
  children?: React.ReactNode;
}) => {
  return (
    <Button
      variant="outline"
      className="group flex w-72"
      onClick={() => action()}
    >
      {children}
    </Button>
  );
};

export default CreateApplicationOrRedirect;
