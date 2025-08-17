import type { InferSelectModel } from "drizzle-orm";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { applications } from "~/server/db/schema";

const TrialWorkday = ({
  application,
}: {
  application: InferSelectModel<typeof applications> & {
    team: { name: string };
  };
}) => {
  return (
    <div>
      <p>As part of our next stage, please confirm your availability!</p>
      {application.team.name === "Solar" && (
        <Link
          className={cn(buttonVariants({}), "mt-4")}
          href={`https://forms.gle/Wot5StyzP9HCZtiN8`}
        >
          Schedule Solar Trial
        </Link>
      )}
      {application.team.name === "Combustion" && (
        <Link
          className={cn(buttonVariants({}), "mt-4")}
          href={`https://forms.gle/e2UZ7mdNdyjfENeG6`}
        >
          Schedule Combustion Trial
        </Link>
      )}
      {application.team.name === "Electric" && (
        <Link
          className={cn(buttonVariants({}), "mt-4")}
          href={`https://forms.gle/ytKMqDeAUkTYywuDA`}
        >
          Schedule Electric Trial
        </Link>
      )}
    </div>
  );
};

export default TrialWorkday;
