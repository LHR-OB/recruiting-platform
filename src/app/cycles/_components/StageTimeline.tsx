"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";

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

interface StageTimelineProps {
  cycle: Cycle;
  onUpdateStage: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

export function StageTimeline({
  cycle,
  onUpdateStage,
  onClose,
}: StageTimelineProps) {
  const [stageStartDates, setStageStartDates] = useState<Record<string, Date>>(
    cycle.stages.reduce(
      (acc, stage) => {
        acc[stage.id] = stage.startDate;
        return acc;
      },
      {} as Record<string, Date>,
    ),
  );

  const [stageEndDates, setStageEndDates] = useState<Record<string, Date>>(
    cycle.stages.reduce(
      (acc, stage) => {
        acc[stage.id] = stage.endDate;
        return acc;
      },
      {} as Record<string, Date>,
    ),
  );

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleUpdateStage = async (stageId: string) => {
    setIsUpdating(stageId);

    try {
      const formData = new FormData();
      formData.append("stageId", stageId);
      formData.append(
        "startDate",
        stageStartDates[stageId]?.toISOString() ?? "",
      );
      formData.append("endDate", stageEndDates[stageId]?.toISOString() ?? "");

      await onUpdateStage(formData);
    } catch (error) {
      console.error("Failed to update stage:", error);
      alert(error instanceof Error ? error.message : "Failed to update stage");
    } finally {
      setIsUpdating(null);
    }
  };

  const hasChanges = (stageId: string) => {
    const stage = cycle.stages.find((s) => s.id === stageId);
    if (!stage) return false;

    const currentStart = stageStartDates[stageId];
    const currentEnd = stageEndDates[stageId];

    return (
      currentStart?.getTime() !== stage.startDate.getTime() ||
      currentEnd?.getTime() !== stage.endDate.getTime()
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-muted-foreground text-sm">
        Edit the start and end dates for each stage in this cycle. Changes will
        be saved immediately when you click the update button for each stage.
      </div>

      <div className="grid gap-4">
        {cycle.stages.map((stage, i) => (
          <Card key={stage.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {i + 1} {stage.stage}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <Label className="pb-2">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {stageStartDates[stage.id]
                          ? format(stageStartDates[stage.id]!, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={stageStartDates[stage.id]}
                        onSelect={(date) => {
                          if (date) {
                            setStageStartDates((prev) => ({
                              ...prev,
                              [stage.id]: date,
                            }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <Label className="pb-2">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {stageEndDates[stage.id]
                          ? format(stageEndDates[stage.id]!, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={stageEndDates[stage.id]}
                        onSelect={(date) => {
                          if (date) {
                            setStageEndDates((prev) => ({
                              ...prev,
                              [stage.id]: date,
                            }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleUpdateStage(stage.id)}
                  disabled={
                    !hasChanges(stage.id) ||
                    isUpdating === stage.id ||
                    !stageStartDates[stage.id] ||
                    !stageEndDates[stage.id]
                  }
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating === stage.id ? "Updating..." : "Update Stage"}
                </Button>
              </div>

              {/* Validation Warning */}
              {stageStartDates[stage.id] &&
                stageEndDates[stage.id] &&
                stageStartDates[stage.id]! >= stageEndDates[stage.id]! && (
                  <div className="text-sm text-red-600">
                    Warning: Start date must be before end date
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
