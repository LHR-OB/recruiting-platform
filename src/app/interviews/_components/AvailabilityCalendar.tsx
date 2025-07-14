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
import { Trash2, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import {
  createAvailability,
  deleteAvailability,
  updateAvailability,
} from "../actions";

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

interface OthersAvailability {
  id: string;
  systemId: string;
  start: Date;
  end: Date;
  system?: System;
  user?: User;
}

export function AvailabilityCalendar({
  initialAvailabilities = [],
  othersAvailabilities = [],
  systems = [],
}: {
  initialAvailabilities?: Availability[];
  othersAvailabilities?: OthersAvailability[];
  systems?: System[];
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availabilities, setAvailabilities] = useState<Availability[]>(
    initialAvailabilities,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<Availability | null>(null);

  // Get availabilities for the selected date
  const selectedDateAvailabilities = selectedDate
    ? availabilities.filter((avail) => {
        const availDate = new Date(avail.start);
        return (
          availDate.getFullYear() === selectedDate.getFullYear() &&
          availDate.getMonth() === selectedDate.getMonth() &&
          availDate.getDate() === selectedDate.getDate()
        );
      })
    : [];

  // Get dates that have availabilities from others (show dots on these dates)
  const datesWithOthersAvailability = othersAvailabilities.map((avail) => {
    const date = new Date(avail.start);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  // Get others' availability for the selected date (to show who's available)
  const selectedDateOthersAvailability = selectedDate
    ? othersAvailabilities.filter((avail) => {
        const availDate = new Date(avail.start);
        return (
          availDate.getFullYear() === selectedDate.getFullYear() &&
          availDate.getMonth() === selectedDate.getMonth() &&
          availDate.getDate() === selectedDate.getDate()
        );
      })
    : [];

  const handleAddAvailability = async (formData: FormData) => {
    if (!selectedDate) return;

    const dateString = format(selectedDate, "yyyy-MM-dd");
    formData.append("startDate", dateString);

    try {
      await createAvailability(formData);
      setIsAddDialogOpen(false);
      // In a real app, you'd refetch the data here
      window.location.reload();
    } catch (error) {
      console.error("Failed to create availability:", error);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    try {
      await deleteAvailability(availabilityId);
      setAvailabilities((prev) =>
        prev.filter((avail) => avail.id !== availabilityId),
      );
    } catch (error) {
      console.error("Failed to delete availability:", error);
    }
  };

  const handleEditAvailability = async (formData: FormData) => {
    if (!editingAvailability) return;

    try {
      await updateAvailability(editingAvailability.id, formData);
      setIsEditDialogOpen(false);
      setEditingAvailability(null);
      // In a real app, you'd refetch the data here
      window.location.reload();
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasOthersAvailability: datesWithOthersAvailability,
            }}
            modifiersStyles={{
              hasOthersAvailability: {
                position: "relative",
              },
            }}
            modifiersClassNames={{
              hasOthersAvailability:
                "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
          />
          <div className="text-muted-foreground mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
              <span>Days when others are available for interviews</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Availabilities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedDate
              ? `Availability for ${format(selectedDate, "MMM dd, yyyy")}`
              : "Select a date to view availability"}
          </CardTitle>
          {selectedDate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Add Availability for {format(selectedDate, "MMM dd, yyyy")}
                  </DialogTitle>
                </DialogHeader>
                <form action={handleAddAvailability} className="space-y-4">
                  <div>
                    <Label htmlFor="systemId">System</Label>
                    <Select name="systemId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a system" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        name="startTime"
                        type="time"
                        required
                        defaultValue="09:00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        name="endTime"
                        type="time"
                        required
                        defaultValue="17:00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Availability</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            <div className="space-y-6">
              {/* Others' availability for this date */}
              {selectedDateOthersAvailability.length > 0 && (
                <div>
                  <h3 className="text-foreground mb-3 text-sm font-medium">
                    Others available on this date:
                  </h3>
                  <div className="space-y-2">
                    {selectedDateOthersAvailability.map((availability) => (
                      <div
                        key={availability.id}
                        className="bg-muted/50 rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="text-foreground font-medium">
                            {availability.user?.name ?? "Unknown User"}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {availability.system?.name ?? "Unknown System"} •{" "}
                            {format(new Date(availability.start), "HH:mm")} -{" "}
                            {format(new Date(availability.end), "HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Your availability for this date */}
              <div>
                <h3 className="text-foreground mb-3 text-sm font-medium">
                  Your availability:
                </h3>
                {selectedDateAvailabilities.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateAvailabilities.map((availability) => (
                      <div
                        key={availability.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {availability.system?.name ?? "Unknown System"}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {format(new Date(availability.start), "HH:mm")} -{" "}
                            {format(new Date(availability.end), "HH:mm")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAvailability(availability);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteAvailability(availability.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-center">
                    No availability set for this date.
                    <br />
                    Click &quot;Add&quot; to set your availability.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              Select a date from the calendar to view or add availability.
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
