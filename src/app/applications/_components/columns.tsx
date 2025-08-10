"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { InferSelectModel, InferSelectViewModel } from "drizzle-orm";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  Ellipsis,
  EllipsisIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  UserSearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
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
  SheetClose,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import type { applications, teams, users } from "~/server/db/schema";
import {
  appViewAtom,
  internalStatuses,
  internalDecisions,
  tableDataAtom,
} from "./data-table";
import {
  moveApplicantToNextStage,
  rejectApplicant,
  setApplicantDecision,
  setApplicantStage,
} from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type App = InferSelectModel<typeof applications> & {
  team: Pick<InferSelectModel<typeof teams>, "name">;
};

export type Application = App & {
  user: Partial<InferSelectModel<typeof users>>;
  otherApplications: App[];
};

export const columns: ColumnDef<Application>[] = [
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
    accessorKey: "team.name",
    header: "Team",
  },
  {
    accessorFn: (row) =>
      [
        row.data?.system1 ?? "",
        row.data?.system2 ?? "",
        row.data?.system3 ?? "",
      ].join(", "),
    header: "Systems",
    cell: ({ row, ...rest }) => (
      <p className="w-32 truncate">{rest.getValue()}</p>
    ),
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const status: InferSelectModel<typeof applications>["status"] =
        row.getValue("status");

      return <Badge variant="secondary">{status}</Badge>;
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
    id: "internalStatus",
    accessorKey: "internalStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-2.5"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Internal Status
          <ChevronsUpDownIcon />
        </Button>
      );
    },
    filterFn: "includesString",
  },
  {
    id: "internalDecision",
    accessorKey: "internalDecision",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-2.5"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Internal Decision
          <ChevronsUpDownIcon />
        </Button>
      );
    },
    filterFn: "includesString",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const { original } = row;
      const open = row.getIsSelected();

      const indexPageAdjusted =
        row.index % table.getState().pagination.pageSize;

      const prevRow = table.getRowModel().rows[indexPageAdjusted - 1];
      const nextRow = table.getRowModel().rows[indexPageAdjusted + 1];

      const setRow = useSetAtom(tableDataAtom);
      const [disableReject, setDisableReject] = useState(false);
      const [disableApprove, setDisableApprove] = useState(false);

      return (
        <div className="flex w-full justify-end">
          <Sheet open={open} onOpenChange={row.toggleSelected}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="size-8">
                <UserSearchIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-xl overflow-y-auto pt-0 sm:max-w-none",
                "transition-none data-[state=closed]:animate-none data-[state=closed]:duration-[0] data-[state=open]:animate-none data-[state=open]:duration-[0]",
              )}
            >
              <div className="bg-background sticky top-0 left-0 flex w-full flex-col border-b py-3">
                <div className="flex w-full justify-between gap-1 px-4 pb-3">
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 size-8 h-8"
                      >
                        <ChevronsRightIcon className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={disableReject}
                      onClick={async () => {
                        setDisableReject(true);
                        await rejectApplicant(original.id);
                        setDisableApprove(false);
                        setRow((prev) => {
                          return prev.map((app) => {
                            if (app.id === original.id) {
                              return {
                                ...app,
                                internalDecision: "REJECTED",
                              };
                            }
                            return app;
                          });
                        });

                        toast.success(`Rejected ${original.user.name}`);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={disableApprove}
                      onClick={async () => {
                        setDisableApprove(true);
                        const currStage = await moveApplicantToNextStage(
                          original.id,
                        );
                        setDisableApprove(false);
                        setRow((prev) => {
                          return prev.map((app) => {
                            if (app.id === original.id) {
                              return {
                                ...app,
                                status: "NEEDS_REVIEW",
                                internalStatus: currStage,
                              };
                            }
                            return app;
                          });
                        });

                        toast.success(
                          `Moved ${original.user.name} to ${currStage}`,
                        );
                      }}
                    >
                      Approve
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={original.user.resumeUrl ?? ""}
                      className={cn(
                        buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        }),
                        "bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 h-8",
                      )}
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      Resume
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 size-8 h-8"
                      disabled={!nextRow}
                      onClick={() => {
                        table.setRowSelection({
                          [row.id]: false,
                          ...(nextRow && {
                            [nextRow.id]: true,
                          }),
                        });
                      }}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 size-8 h-8"
                      disabled={!prevRow}
                      onClick={() =>
                        table.setRowSelection({
                          [row.id]: false,
                          ...(prevRow && {
                            [prevRow.id]: true,
                          }),
                        })
                      }
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex w-full gap-1 border-t px-4 pt-3">
                  <Select
                    value={original.internalStatus}
                    onValueChange={async (value) => {
                      setRow((prev) => {
                        return prev.map((app) => {
                          if (app.id === original.id) {
                            return {
                              ...app,
                              internalStatus: value as
                                | InferSelectModel<
                                    typeof applications
                                  >["status"]
                                | undefined,
                            };
                          }
                          return app;
                        });
                      });
                      await setApplicantStage(original.id, value);
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(internalStatuses).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={original.internalDecision}
                    onValueChange={async (value) => {
                      setRow((prev) => {
                        return prev.map((app) => {
                          if (app.id === original.id) {
                            return {
                              ...app,
                              internalDecision: value as
                                | InferSelectModel<
                                    typeof applications
                                  >["status"]
                                | undefined,
                            };
                          }
                          return app;
                        });
                      });
                      await setApplicantDecision(
                        original.id,
                        value as InferSelectModel<
                          typeof applications
                        >["internalDecision"],
                      );
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(internalDecisions).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetHeader className="pt-1">
                <SheetTitle>{original.user.name}</SheetTitle>
                <SheetDescription>{original.user.email}</SheetDescription>
                <p className="text-muted-foreground text-sm">
                  Status: {internalStatuses[original.internalStatus]}
                </p>
              </SheetHeader>
              <div className="px-4">
                <p>Application</p>
                <div className="flex flex-col gap-4">
                  <div className="space-y-1 pt-1">
                    <p className="text-muted-foreground text-sm">
                      Teams Applied This Cycle
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{original.team.name}</Badge>
                      {original.otherApplications.map((app) => {
                        return (
                          <Badge variant="secondary" key={app.id}>
                            {app.team.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1 space-x-2">
                    <p className="text-muted-foreground text-sm">
                      Systems (Ranked)
                    </p>
                    {[
                      original.data?.system1,
                      original.data?.system2,
                      original.data?.system3,
                    ]
                      .filter((sys) => sys)
                      .map((sys) => (
                        <Badge variant="secondary" key={sys}>
                          {sys}
                        </Badge>
                      ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">
                      System Justification
                    </p>
                    <div className="rounded-md border p-2 text-sm">
                      {original.data?.systemJustification}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">Interest</p>
                    <div className="rounded-md border p-2 text-sm">
                      {original.data?.interest}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">Project</p>
                    <div className="rounded-md border p-2 text-sm">
                      {original.data?.project}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">Resume</p>
                    {original.user.resumeUrl && (
                      <embed
                        src={original.user.resumeUrl}
                        className="h-[600px] w-full"
                        type="application/pdf"
                      />
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      );
    },
  },
];
