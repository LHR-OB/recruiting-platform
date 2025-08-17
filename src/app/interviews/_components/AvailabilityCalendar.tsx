"use client";

import { useState } from "react";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Plus } from "lucide-react";
import { format, isWithinInterval, parse } from "date-fns";
import {
  createAvailability,
  deleteAvailability,
  updateAvailability,
} from "../actions";
import type { DateRange } from "react-day-picker";
import { eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface System {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
}

interface Availability {
  id: string;
  systemId: string;
  start: Date;
  end: Date;
  system?: System;
}

export function AvailabilityCalendar({
  initialAvailabilities = [],

  systems = [],
}: {
  initialAvailabilities?: Availability[];

  systems?: System[];
}) {
  const router = useRouter();

  // Refactored: use range selection
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined,
  );

  const [availabilities, setAvailabilities] = useState<Availability[]>(
    initialAvailabilities,
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<Availability | null>(null);

  // Get all days in the selected range
  const daysInRange =
    selectedRange?.from && selectedRange?.to
      ? eachDayOfInterval({ start: selectedRange.from, end: selectedRange.to })
      : [];

  // State for system and time selection (applies to all days)
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("09:00");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("17:00");

  // Highlight days with user's own availability
  const datesWithYourAvailability = availabilities.map((avail) => {
    const date = new Date(avail.start);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  // Filter availabilities for selected range
  const selectedRangeAvailabilities =
    selectedRange?.from && selectedRange?.to
      ? availabilities.filter((avail) =>
          isWithinInterval(new Date(avail.start), {
            start: selectedRange.from!,
            end: selectedRange.to!,
          }),
        )
      : [];

  const handleEditAvailability = async (formData: FormData) => {
    if (!editingAvailability) return;

    try {
      await updateAvailability(editingAvailability.id, formData);
      setIsEditDialogOpen(false);
      setEditingAvailability(null);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  return (
    <div className="">
      {/* Range Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Calendar Section */}
            <div className="w-fit">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                // days that already have your availability
                disabled={(date) =>
                  datesWithYourAvailability.some(
                    (d) =>
                      d.getFullYear() === date.getFullYear() &&
                      d.getMonth() === date.getMonth() &&
                      d.getDate() === date.getDate(),
                  ) ||
                  selectedRangeAvailabilities.some((avail) =>
                    isWithinInterval(date, {
                      start: new Date(avail.start),
                      end: new Date(avail.end),
                    }),
                  )
                }
                className="rounded-md border [--cell-size:--spacing(10)]"
                modifiers={{
                  yourExistingAvailability: datesWithYourAvailability,
                }}
                modifiersStyles={{
                  yourExistingAvailability: {
                    position: "relative",
                  },
                }}
                modifiersClassNames={{
                  yourExistingAvailability:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                  today: "bg-none",
                }}
              />
              <div className="text-muted-foreground mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                  <span>Days when you are available for interviews</span>
                </div>
              </div>
            </div>
            {/* Availabilities Table Section */}
            <div className="grow">
              <div className="max-h-128 overflow-y-auto rounded-md border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        System
                      </th>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Time</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilities.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-muted-foreground py-4 text-center"
                        >
                          You have no availabilities set.
                        </td>
                      </tr>
                    ) : (
                      availabilities.map((availability) => (
                        <tr
                          key={availability.id}
                          className="border-b last:border-b-0"
                        >
                          <td className="px-4 py-2">
                            {availability.system?.name ?? "Unknown System"}
                          </td>
                          <td className="px-4 py-2">
                            {format(
                              new Date(availability.start),
                              "MMM dd, yyyy",
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {format(new Date(availability.start), "HH:mm")} -{" "}
                            {format(new Date(availability.end), "HH:mm")}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const res = await deleteAvailability(
                                  availability.id,
                                );

                                if (res) {
                                  toast.error(res);
                                } else {
                                  toast.success(
                                    "Availability deleted successfully!",
                                  );
                                  setAvailabilities((prev) =>
                                    prev.filter(
                                      (a) => a.id !== availability.id,
                                    ),
                                  );
                                  router.refresh();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Range Availabilities */}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
          </DialogHeader>
          {editingAvailability && (
            <form action={handleEditAvailability} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    name="startTime"
                    type="time"
                    required
                    defaultValue={format(
                      new Date(editingAvailability.start),
                      "HH:mm",
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    name="endTime"
                    type="time"
                    required
                    defaultValue={format(
                      new Date(editingAvailability.end),
                      "HH:mm",
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAvailability(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Availability</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Confirm Interview Availability Card */}
      {daysInRange.length > 0 && (
        <Card className="mt-6 gap-4">
          <CardHeader>
            <CardTitle>Confirm Interview Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const payload = daysInRange.map((date) => ({
                  date,
                  systemId: selectedSystemId,
                  startTime: parse(selectedStartTime, "HH:mm", new Date()),
                  endTime: parse(selectedEndTime, "HH:mm", new Date()),
                }));

                const res = await createAvailability(payload);

                if (res) {
                  toast.error(res);
                } else {
                  toast.success("Availability confirmed successfully!");

                  setSelectedRange(undefined);
                  setSelectedSystemId("");
                  setSelectedStartTime("09:00");
                  setSelectedEndTime("17:00");
                  setAvailabilities((prev) => [
                    ...prev,
                    ...payload.map((p) => ({
                      id: `${p.date.toISOString()}-${p.systemId}`,
                      systemId: p.systemId,
                      system: {
                        id: p.systemId,
                        name: systems.find((s) => s.id === p.systemId)!.name,
                      },
                      start: new Date(
                        p.date.getFullYear(),
                        p.date.getMonth(),
                        p.date.getDate(),
                        p.startTime.getHours(),
                        p.startTime.getMinutes(),
                      ),
                      end: new Date(
                        p.date.getFullYear(),
                        p.date.getMonth(),
                        p.date.getDate(),
                        p.endTime.getHours(),
                        p.endTime.getMinutes(),
                      ),
                    })),
                  ]);

                  router.refresh();
                }
              }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-4 md:flex-row">
                <div>
                  <Label htmlFor="systemId" className="pb-2">
                    System
                  </Label>
                  <Select
                    value={selectedSystemId}
                    onValueChange={setSelectedSystemId}
                    required
                    name="systemId"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startTime" className="pb-2">
                    Start Time
                  </Label>
                  <Input
                    type="time"
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    required
                    name="startTime"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="pb-2">
                    End Time
                  </Label>
                  <Input
                    type="time"
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    required
                    step="1"
                    name="endTime"
                  />
                </div>
              </div>
              <div>
                <Label>Days:</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {daysInRange.map((date) => (
                    <span
                      key={date.toISOString()}
                      className="bg-primary-foreground text-primary inline-block rounded-md border px-3 py-1 text-sm font-medium"
                    >
                      {format(date, "MMM dd, yyyy")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit">Confirm Availability</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
