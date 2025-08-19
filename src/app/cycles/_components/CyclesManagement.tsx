"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import {
  createCycle,
  updateStage,
  updateCycleStage,
  deleteCycle,
} from "../actions";
import { StageTimeline } from "./StageTimeline";
import { cn } from "~/lib/utils";
import { applicationCycleStatusEnum } from "~/server/db/schema";

interface Stage {
  id: string;
  stage: string;
  startDate: Date;
  endDate: Date;
}

interface Cycle {
  id: string;
  name: string;
  stage: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  stages: Stage[];
}

interface CyclesManagementProps {
  cycles: Cycle[];
}

export function CyclesManagement({ cycles }: CyclesManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [isStageChangeDialogOpen, setIsStageChangeDialogOpen] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{
    cycleId: string;
    newStage: string;
    cycleName: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteCycle, setPendingDeleteCycle] = useState<{
    cycleId: string;
    cycleName: string;
  } | null>(null);

  const handleCreateCycle = async (formData: FormData) => {
    try {
      await createCycle(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create cycle:", error);
      alert(error instanceof Error ? error.message : "Failed to create cycle");
    }
  };

  const handleUpdateStage = async (formData: FormData) => {
    try {
      await updateStage(formData);
    } catch (error) {
      console.error("Failed to update stage:", error);
      alert(error instanceof Error ? error.message : "Failed to update stage");
    }
  };

  const handleDeleteCycle = async (cycleId: string, cycleName: string) => {
    setPendingDeleteCycle({ cycleId, cycleName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCycle = async () => {
    if (!pendingDeleteCycle) return;

    try {
      await deleteCycle(pendingDeleteCycle.cycleId);
      setIsDeleteDialogOpen(false);
      setPendingDeleteCycle(null);
    } catch (error) {
      console.error("Failed to delete cycle:", error);
      alert(error instanceof Error ? error.message : "Failed to delete cycle");
    }
  };

  const cancelDeleteCycle = () => {
    setIsDeleteDialogOpen(false);
    setPendingDeleteCycle(null);
  };

  const handleStageChange = async (
    cycleId: string,
    newStage: string,
    cycleName: string,
  ) => {
    setPendingStageChange({ cycleId, newStage, cycleName });
    setIsStageChangeDialogOpen(true);
  };

  const confirmStageChange = async () => {
    if (!pendingStageChange) return;

    try {
      await updateCycleStage(
        pendingStageChange.cycleId,
        pendingStageChange.newStage as
          | "PREPARATION"
          | "APPLICATION"
          | "INTERVIEW"
          | "TRAIL"
          | "FINAL",
      );
      setIsStageChangeDialogOpen(false);
      setPendingStageChange(null);
    } catch (error) {
      console.error("Failed to update cycle stage:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update cycle stage",
      );
    }
  };

  const cancelStageChange = () => {
    setIsStageChangeDialogOpen(false);
    setPendingStageChange(null);
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Create New Cycle Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manage Cycles</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Application Cycle</DialogTitle>
            </DialogHeader>
            <CreateCycleForm onSubmit={handleCreateCycle} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cycles List */}
      <div className="grid gap-4">
        {cycles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No application cycles found.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Create your first cycle to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          cycles.map((cycle) => (
            <Card key={cycle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {cycle.name}
                      <Badge>{cycle.stage}</Badge>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {format(cycle.startDate, "MMM dd, yyyy")} -{" "}
                      {format(cycle.endDate, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCycle(cycle);
                        setIsTimelineDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Timeline
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCycle(cycle.id, cycle.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stage Timeline */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Stage Timeline:</div>
                    <div className="space-y-2">
                      {cycle.stages.map((stage, index) => (
                        <div
                          key={stage.id}
                          className={cn(
                            stage.stage === cycle.stage && "bg-muted",
                            "flex items-center justify-between rounded-md border p-3",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {stage.stage}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {format(stage.startDate, "MMM dd, yyyy")} -{" "}
                                {format(stage.endDate, "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stage Controls */}
                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="text-sm font-medium">
                      Change Current Stage
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Use with caution
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {applicationCycleStatusEnum.enumValues.map((stage) => (
                      <Button
                        key={stage}
                        variant={"outline"}
                        size="sm"
                        className={cn(
                          cycle.stage === stage &&
                            "bg-foreground! text-background",
                        )}
                        onClick={() =>
                          handleStageChange(cycle.id, stage, cycle.name)
                        }
                        disabled={cycle.stage === stage}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Timeline Dialog */}
      <Dialog
        open={isTimelineDialogOpen}
        onOpenChange={setIsTimelineDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Timeline - {selectedCycle?.name}</DialogTitle>
          </DialogHeader>
          {selectedCycle && (
            <StageTimeline
              cycle={selectedCycle}
              onUpdateStage={handleUpdateStage}
              onClose={() => setIsTimelineDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Change Confirmation Dialog */}
      <Dialog
        open={isStageChangeDialogOpen}
        onOpenChange={setIsStageChangeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Change Current Stage
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to change the current stage to{" "}
              <span className="font-semibold">
                {pendingStageChange?.newStage}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-destructive/25 bg-destructive/15 rounded-lg border p-4">
              <div className="text-sm">
                <div className="mb-2">
                  Cycle: {pendingStageChange?.cycleName}
                </div>
                <div>
                  This is a critical action that affects the entire recruitment
                  process. Only change the stage if you&apos;re certain
                  it&apos;s necessary.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelStageChange}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmStageChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cycle Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Delete Cycle
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete the cycle{" "}
              <span className="font-semibold">
                {pendingDeleteCycle?.cycleName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-destructive/25 bg-destructive/15 rounded-lg border p-4">
              <div className="text-sm">
                This action will permanently delete the cycle and all its stage
                timelines. All applications associated with this cycle will lose
                their cycle reference.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteCycle}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCycle}>
              Delete Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateCycleForm({
  onSubmit,
}: {
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Cycle Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Fall 2024 Recruitment"
          required
        />
      </div>

      <div className="bg-muted/30 rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">Cycle Timeline</div>
        <div className="text-muted-foreground mb-4 text-xs">
          Set the overall start and end dates for this recruitment cycle.
          Individual stage timelines will be created within these boundaries.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Cycle Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="startDate"
              value={startDate ? startDate.toISOString() : ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Cycle End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="endDate"
              value={endDate ? endDate.toISOString() : ""}
            />
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        Note: After creating the cycle, you can edit individual stage timelines
        within these boundaries using the &quot;Edit Timeline&quot; button.
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!startDate || !endDate}>
          Create Cycle
        </Button>
      </div>
    </form>
  );
}
