"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { InferSelectModel, InferSelectViewModel } from "drizzle-orm";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  CircleQuestionMarkIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  Ellipsis,
  EllipsisIcon,
  ExternalLinkIcon,
  EyeIcon,
  MoreHorizontalIcon,
  UserSearchIcon,
  FileIcon,
  LucideToolCase,
  TrendingDownIcon,
  SplitIcon,
  MessagesSquareIcon,
  NotepadTextIcon,
  CircleIcon,
  CircleDotDashedIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";

import { applicationCycleStatusEnum } from "~/server/db/schema";
import {
  applicationStatusEnum,
  type applications,
  type teams,
  type users,
} from "~/server/db/schema";

import ActionsCell from "./actions-cell";
import {
  internalDecisions,
  internalStatuses,
  systemIdAtom,
} from "./data-table";
import { useAtomValue } from "jotai";

export const appStatusToIcon = {
  NEEDS_REVIEW: <EyeIcon className="stroke-background fill-foreground" />,
  ACCEPTED: <CircleCheckIcon className="stroke-background fill-green-500" />,
  REJECTED: <CircleSlashIcon className="stroke-background fill-red-500" />,
  WAITLISTED: <CircleDotDashedIcon className="stroke-foreground" />,
  REVIEWED: <CircleDashedIcon className="stroke-foreground" />,
} as Record<
  (typeof applicationStatusEnum)["enumValues"][number],
  React.ReactNode
>;

export const appStageToIcon = {
  DRAFT: <div />,
  APPLICATION: <FileIcon className="stroke-background fill-foreground" />,
  TRAIL: <LucideToolCase className="stroke-background fill-foreground" />,
  FINAL: <SplitIcon className="stroke-foreground" />,
  INTERVIEW: (
    <MessagesSquareIcon className="fill-foreground stroke-background" />
  ),
  PREPARATION: (
    <NotepadTextIcon className="stroke-background fill-foreground" />
  ),
} as Record<
  (typeof applicationCycleStatusEnum)["enumValues"][number],
  React.ReactNode
>;

type App = InferSelectModel<typeof applications> & {
  team: Pick<InferSelectModel<typeof teams>, "name">;
  consideredSystems: string[];
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
          Status
          <ChevronsUpDownIcon />
        </Button>
      );
    },
    cell: ({ row }) => {
      const decision: InferSelectModel<
        typeof applications
      >["internalDecision"] =
        row.getValue("internalDecision") ?? row.getValue("status")!;

      return (
        <Badge variant="outline">
          {appStatusToIcon[decision]}
          {internalDecisions[decision]}
        </Badge>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = applicationStatusEnum.enumValues.indexOf(
        rowA.getValue("internalDecision"),
      );
      const b = applicationStatusEnum.enumValues.indexOf(
        rowB.getValue("internalDecision"),
      );

      return a - b;
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "internalStatus",
    accessorKey: "internalStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-2.5"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          size="sm"
        >
          Stage
          <ChevronsUpDownIcon />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status: InferSelectModel<typeof applications>["internalStatus"] =
        row.getValue("internalStatus");

      return (
        <Badge variant="outline">
          {appStageToIcon[status]}
          {internalStatuses[status]}
        </Badge>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = applicationCycleStatusEnum.enumValues.indexOf(
        rowA.getValue("internalStatus"),
      );
      const b = applicationCycleStatusEnum.enumValues.indexOf(
        rowB.getValue("internalStatus"),
      );

      return a - b;
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
];
