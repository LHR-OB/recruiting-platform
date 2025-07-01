import type { ColumnDef } from "@tanstack/react-table";
import type { InferSelectModel } from "drizzle-orm";
import type { z } from "zod";
import type { applications, users } from "~/server/db/schema";

export type Application = InferSelectModel<typeof applications> & {
  user: InferSelectModel<typeof users>;
  teamName: string;
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "user.name",
    header: "Name",
  },
  {
    accessorKey: "user.email",
    header: "Email",
  },
  {
    accessorKey: "teamName",
    header: "Team",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
