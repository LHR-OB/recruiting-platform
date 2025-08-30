import {
  internalStatuses,
  internalDecisions,
  tableDataAtom,
  stageAtom,
  systemIdAtom,
} from "./data-table";
import {
  moveApplicantToNextStage,
  rejectApplicant,
  setApplicantDecision,
  setApplicantStage,
  setApplicationColor,
  waitlistApplicant,
} from "../actions";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "~/components/ui/button";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";

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
import { useAtomValue, useSetAtom } from "jotai";
import type { InferSelectModel, InferSelectViewModel } from "drizzle-orm";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "~/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState } from "react";
import type { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { appStageToIcon, appStatusToIcon, type Application } from "./columns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
const ActionsCell: ColumnDefTemplate<CellContext<Application, string>> = ({
  row,
  table,
}) => {
  const { original } = row;
  const open = row.getIsSelected();
  const model = table.getSortedRowModel();

  const pageSize = table.getState().pagination.pageSize;
  const currPage = table.getState().pagination.pageIndex;

  const i = model.rows.findIndex((r) => r.id === row.id);

  const prevRow = model.rows[i - 1];
  const nextRow = model.rows[i + 1];

  const stage = useAtomValue(stageAtom);
  const systemId = useAtomValue(systemIdAtom);
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
            <div className="flex w-full justify-between gap-1 px-4">
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
                    const res = await rejectApplicant(original.id, systemId!);

                    if (res) {
                      toast.error(res);
                      setDisableReject(false);
                      return;
                    }

                    table.setRowSelection({
                      [row.id]: false,
                      ...(nextRow && {
                        [nextRow.id]: true,
                      }),
                    });

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

                    setDisableApprove(false);

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

                    table.setRowSelection({
                      [row.id]: false,
                      ...(nextRow && {
                        [nextRow.id]: true,
                      }),
                    });

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

                    setDisableApprove(false);

                    toast.success(
                      `Moved ${original.user.name} to ${currStage}`,
                    );
                  }}
                >
                  {(disableApprove && (
                    <LoaderCircleIcon className="animate-spin" />
                  )) ||
                    "Approve"}
                </Button>
                {stage === "FINAL" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await waitlistApplicant(original.id);
                      setRow((prev) => {
                        return prev.map((app) => {
                          if (app.id === original.id) {
                            return {
                              ...app,
                              internalDecision: "WAITLISTED",
                            };
                          }
                          return app;
                        });
                      });
                      toast.success(`Waitlisted ${original.user.name}`);
                    }}
                  >
                    Waitlist
                  </Button>
                )}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 size-8 h-8"
                    >
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup className="pr-4 pb-2">
                      <DropdownMenuLabel>Manual</DropdownMenuLabel>
                      <Select
                        value={original.internalStatus}
                        onValueChange={async (value) => {
                          const error = await setApplicantStage(
                            original.id,
                            value,
                          );

                          if (error) {
                            toast.error(error);
                          } else {
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
                          }
                        }}
                      >
                        <SelectTrigger className="ml-2 h-8 w-full">
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
                          const error = await setApplicantDecision(
                            original.id,
                            value,
                          );

                          if (error) {
                            toast.error(error);
                          } else {
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
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2 ml-2 h-8 w-full">
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
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-muted-foreground/10 dark:hover:bg-muted-foreground/20 size-8 h-8"
                  disabled={!nextRow}
                  onClick={() => {
                    if ((currPage + 1) * pageSize - 1 === i) {
                      table.nextPage();
                    }

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
                  onClick={() => {
                    if (currPage * pageSize === i) {
                      table.previousPage();
                    }

                    table.setRowSelection({
                      [row.id]: false,
                      ...(prevRow && {
                        [prevRow.id]: true,
                      }),
                    });
                  }}
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 border-t px-4 pt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-16 p-px">
                    <div
                      className="h-full w-full rounded-sm border"
                      style={{
                        backgroundColor: `var(${original.highlightColor})`,
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="flex w-auto gap-2 p-2">
                  {[
                    "--color-transparent",
                    "--color-red-500",
                    "--color-orange-500",
                    "--color-yellow-500",
                    "--color-green-500",
                    "--color-blue-500",
                  ].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 border-white shadow focus:ring-2 focus:ring-offset-2 focus:outline-none",
                      )}
                      style={{ backgroundColor: `var(${color})` }}
                      onClick={async () => {
                        setRow((prev) =>
                          prev.map((app) =>
                            app.id === original.id
                              ? { ...app, highlightColor: color }
                              : app,
                          ),
                        );

                        await setApplicationColor(original.id, color);
                      }}
                      aria-label={`Set highlight color ${color}`}
                    />
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <SheetHeader className="pt-1">
            <div className="flex w-full justify-between">
              <SheetTitle>{original.user.name}</SheetTitle>
              <span className="text-muted-foreground">
                {original.user.phoneNumber}, {original.user.email}
              </span>
            </div>
            <SheetDescription>
              {original.user.eidEmail?.split("@")[0]}
            </SheetDescription>
            <SheetDescription>
              Created {original.createdAt.toLocaleDateString()}
            </SheetDescription>
            <SheetDescription>{original.user.major}</SheetDescription>

            <div className="flex gap-1">
              <Badge variant="secondary">
                {appStatusToIcon[original.internalDecision ?? "NEEDS_REVIEW"]}
                {internalDecisions[original.internalDecision ?? "NEEDS_REVIEW"]}
              </Badge>
              <Badge variant="secondary">
                {appStageToIcon[original.internalStatus]}
                {internalStatuses[original.internalStatus]}
              </Badge>
            </div>
          </SheetHeader>
          <div className="px-4">
            <p>Application</p>
            <div className="flex flex-col gap-4">
              <div className="space-y-1 pt-1">
                <p className="text-muted-foreground text-sm">
                  Other Teams Applied This Cycle
                </p>
                <div className="flex flex-col gap-2">
                  {(original.otherApplications.filter((app) => app.data)
                    .length &&
                    original.otherApplications
                      .filter((app) => app.data)
                      .map((app) => {
                        return (
                          <div
                            variant="secondary"
                            key={app.id}
                            className="gap-1 text-sm"
                          >
                            <p>{app.team.name}</p>
                            <div className="flex gap-2 pt-1">
                              {[
                                "1 - " + app.data?.system1,
                                "2 - " + app.data?.system2,
                                "3 - " + app.data?.system3,
                              ]
                                .filter((sys) => sys)
                                .map((sys) => (
                                  <Badge variant="secondary" key={sys}>
                                    {sys}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        );
                      })) || <span className="text-sm">None</span>}
                </div>
              </div>
              <div className="space-y-1 space-x-2">
                <p className="text-muted-foreground text-sm">
                  Systems (Ranked)
                </p>
                {[
                  "1 - " + original.data?.system1,
                  "2 - " + original.data?.system2,
                  "3 - " + original.data?.system3,
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
};

export default ActionsCell;
