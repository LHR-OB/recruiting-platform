"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { InferSelectModel, InferSelectViewModel } from "drizzle-orm";
import {
  ChevronsUpDownIcon,
  Ellipsis,
  EllipsisIcon,
  MoreHorizontalIcon,
  UserSearchIcon,
} from "lucide-react";
import type { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import type { applications, users } from "~/server/db/schema";

export type Application = InferSelectModel<typeof applications> & {
  user: Pick<InferSelectModel<typeof users>, "name" | "id">;
  teamName: string;
};

export const columns: ColumnDef<Application>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2.5"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ChevronsUpDownIcon />
        </Button>
      );
    },
  },
  {
    accessorKey: "user.email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-2.5"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ChevronsUpDownIcon />
        </Button>
      );
    },
  },
  {
    accessorKey: "teamName",
    header: "Team",
  },
  {
    accessorFn: (row) =>
      [row.data.system1, row.data.system2, row.data.system3].join(", "),
    header: "Systems",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const status: InferSelectModel<typeof applications>["status"] =
        row.getValue("status");

      return (
        <Badge
          variant="secondary"
          className={cn(
            status === "ACCEPTED" && "border-green-800 bg-green-900",
            status === "REJECTED" && "border-red-800 bg-red-900",
            status === "REVIEWED" && "border-blue-800 bg-blue-900",
          )}
        >
          {status}
        </Badge>
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-2.5"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ChevronsUpDownIcon />
        </Button>
      );
    },
    filterFn: "includesString",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { original } = row;

      return (
        <div className="flex w-full justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="size-8">
                <UserSearchIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-xl sm:max-w-none">
              <SheetHeader>
                <SheetTitle>{original.user.name}</SheetTitle>
                <SheetDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" className="size-8">
            <EllipsisIcon className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
