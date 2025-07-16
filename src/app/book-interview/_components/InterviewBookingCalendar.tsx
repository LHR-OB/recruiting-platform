"use client";

import { useState, useEffect } from "react";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
} from "~/components/ui/dialog";
import { Clock, User, Calendar as CalendarIcon } from "lucide-react";
import { format, addMinutes, isBefore } from "date-fns";
import { bookInterview } from "../actions";

interface System {
  id: string;
  name: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  role: string;
}

interface Availability {
  id: string;
  systemId: string;
  start: Date;
  end: Date;
  system?: System;
  user?: User;
}

interface TimeSlot {
  start: Date;
  end: Date;
  availabilityId: string;
  interviewer: string;
  system: string;
}

export function InterviewBookingCalendar({
  availabilities = [],
  systems = [],
  teams = [],
}: {
  availabilities?: Availability[];
  systems?: System[];
  teams?: Team[];
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Auto-select team and systems when there's only one option
  useEffect(() => {
    if (teams.length === 1 && selectedTeam === "") {
      setSelectedTeam(teams[0]!.id);
    }
    if (systems.length === 1 && selectedSystems.length === 0) {
      setSelectedSystems([systems[0]!.id]);
    }
  }, [teams, systems, selectedTeam, selectedSystems.length]);

  // Filter systems by selected team
  const filteredSystems = selectedTeam
    ? systems.filter((system) => system.teamId === selectedTeam)
    : systems;

  // Filter availabilities by selected systems and date
  const filteredAvailabilities = availabilities.filter((avail) => {
    if (
      selectedSystems.length > 0 &&
      !selectedSystems.includes(avail.systemId)
    ) {
      return false;
    }

    if (selectedDate) {
      const availDate = new Date(avail.start);
      return (
        availDate.getFullYear() === selectedDate.getFullYear() &&
        availDate.getMonth() === selectedDate.getMonth() &&
        availDate.getDate() === selectedDate.getDate()
      );
    }

    return true;
  });

  // Generate 30-minute slots from availabilities
  const generateTimeSlots = (availability: Availability): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const start = new Date(availability.start);
    const end = new Date(availability.end);

    let current = start;

    while (
      isBefore(addMinutes(current, 30), end) ||
      addMinutes(current, 30).getTime() === end.getTime()
    ) {
      slots.push({
        start: new Date(current),
        end: addMinutes(current, 30),
        availabilityId: availability.id,
        interviewer: availability.user?.name ?? "Unknown",
        system: availability.system?.name ?? "Unknown System",
      });

      current = addMinutes(current, 30);
    }

    return slots;
  };

  // Get all available time slots for the selected date
  const availableSlots = filteredAvailabilities.flatMap(generateTimeSlots);

  // Get dates that have availabilities (for calendar dots)
  const datesWithAvailability = availabilities
    .filter((avail) => {
      if (selectedSystems.length > 0) {
        return selectedSystems.includes(avail.systemId);
      }
      return true;
    })
    .map((avail) => {
      const date = new Date(avail.start);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

  const handleBookSlot = async (slot: TimeSlot) => {
    const formData = new FormData();
    formData.append("availabilityId", slot.availabilityId);
    formData.append("startTime", format(slot.start, "HH:mm"));
    formData.append("endTime", format(slot.end, "HH:mm"));
    formData.append("date", format(slot.start, "yyyy-MM-dd"));

    try {
      await bookInterview(formData);
      setIsBookDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Failed to book interview:", error);
      alert(
        error instanceof Error ? error.message : "Failed to book interview",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {systems.length === 1 && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Interview System: {systems[0]?.name}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                You can interview for your top system preference.
              </p>
            </div>
          )}

          {systems.length > 1 && (
            <div className="mb-4 rounded-lg bg-orange-50 p-3 text-sm dark:bg-orange-950">
              <p className="font-medium text-orange-900 dark:text-orange-100">
                Multiple Systems Available
              </p>
              <p className="text-orange-700 dark:text-orange-300">
                You can interview for multiple systems because you applied for
                Solar.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="team">Team</Label>
            <Select
              value={selectedTeam}
              onValueChange={(value) => {
                setSelectedTeam(value);
                setSelectedSystems([]); // Reset systems when team changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="">All teams</SelectItem> */}
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Systems</Label>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {filteredSystems.map((system) => (
                <label key={system.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedSystems.includes(system.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSystems([...selectedSystems, system.id]);
                      } else {
                        setSelectedSystems(
                          selectedSystems.filter((id) => id !== system.id),
                        );
                      }
                    }}
                    className="border-input rounded"
                  />
                  <span className="text-sm">{system.name}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedSystems.length > 0 && (
            <div className="text-muted-foreground text-sm">
              {selectedSystems.length} system
              {selectedSystems.length > 1 ? "s" : ""} selected
            </div>
          )}
        </CardContent>
      </Card>

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
              hasAvailability: datesWithAvailability,
            }}
            modifiersClassNames={{
              hasAvailability:
                "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
          />
          <div className="text-muted-foreground mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
              <span>Days with available interview slots</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Slots */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Available Slots - ${format(selectedDate, "MMM dd, yyyy")}`
              : "Select a date to view slots"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            availableSlots.length > 0 ? (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {availableSlots.map((slot, index) => (
                  <div
                    key={`${slot.availabilityId}-${index}`}
                    className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          {format(slot.start, "HH:mm")} -{" "}
                          {format(slot.end, "HH:mm")}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          {slot.interviewer}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {slot.system}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsBookDialogOpen(true);
                        }}
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No available slots for this date.
                {selectedSystems.length > 0 && (
                  <div className="mt-2 text-sm">
                    Try selecting different systems or a different date.
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              Select a date from the calendar to view available interview slots.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Interview Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Interview Booking</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {format(selectedSlot.start, "EEEE, MMMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {format(selectedSlot.start, "HH:mm")} -{" "}
                    {format(selectedSlot.end, "HH:mm")} (30 minutes)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedSlot.interviewer}
                  </span>
                </div>
                <div className="text-muted-foreground text-sm">
                  System: {selectedSlot.system}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBookDialogOpen(false);
                    setSelectedSlot(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleBookSlot(selectedSlot)}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
