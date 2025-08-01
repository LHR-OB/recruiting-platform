"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Badge } from "~/components/ui/badge";
import { CalendarIcon, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getAvailableSlots, scheduleInterview } from "~/app/interview/actions";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  interviewerId?: string;
  interviewerName?: string;
}

interface InterviewSchedulerProps {
  applicationId: string;
  teamId: string;
  systemId: string | null;
  alreadyScheduled?: boolean;
  isSolarApplicant?: boolean;
}

export function InterviewScheduler({
  applicationId,
  teamId,
  systemId,
  alreadyScheduled = false,
  isSolarApplicant = false,
}: InterviewSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const fetchAvailableSlots = useCallback(
    async (date: Date) => {
      if (!date) return;

      setIsLoading(true);
      try {
        const slots = await getAvailableSlots(systemId, date);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to fetch available slots:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [teamId, systemId],
  );

  useEffect(() => {
    if (selectedDate) {
      void fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots]);

  const handleScheduleInterview = async () => {
    if (!selectedSlot) return;

    setIsScheduling(true);
    try {
      await scheduleInterview(
        applicationId,
        systemId,
        selectedSlot.start,
        selectedSlot.end,
      );
      setIsScheduled(true);
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      alert(
        error instanceof Error ? error.message : "Failed to schedule interview",
      );
    } finally {
      setIsScheduling(false);
    }
  };

  if (isScheduled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold">Interview Scheduled!</h3>
              <p className="text-muted-foreground mt-2">
                Your interview has been successfully scheduled
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of the day

  return (
    <div className="space-y-6">
      {isSolarApplicant && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm text-blue-800">
            <div className="font-medium">Solar System Applicant</div>
            <div className="mt-1">
              As a solar system applicant, you can schedule multiple interviews
              across different solar teams if needed.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select a Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={
                (date) =>
                  date < today || date.getDay() === 0 || date.getDay() === 6 // Disable weekends
              }
              className="rounded-md border [--cell-size:--spacing(10)]"
            />
            <p className="text-muted-foreground mt-3 text-sm">
              Select a weekday to view available interview slots.
            </p>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Time Slots
              {selectedDate && (
                <span className="text-muted-foreground text-sm font-normal">
                  for {format(selectedDate, "MMMM dd, yyyy")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Please select a date to view available time slots.
                </p>
              </div>
            ) : isLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Loading available slots...
                </p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      !slot.available
                        ? "bg-muted/50 border-muted cursor-not-allowed"
                        : selectedSlot === slot
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                    }`}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {format(slot.start, "h:mm a")} -{" "}
                          {format(slot.end, "h:mm a")}
                        </div>
                        {slot.available && slot.interviewerName && (
                          <div className="text-muted-foreground text-sm">
                            with {slot.interviewerName}
                          </div>
                        )}
                      </div>
                      <div>
                        {slot.available ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800"
                          >
                            Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {availableSlots.filter((s) => s.available).length === 0 && (
                  <div className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-orange-500" />
                    <p className="text-muted-foreground">
                      No available slots for this date.
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Please try selecting a different date.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 border-t pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Selected Interview Slot</h4>
                    <p className="text-muted-foreground text-sm">
                      {format(selectedSlot.start, "EEEE, MMMM dd, yyyy")} from{" "}
                      {format(selectedSlot.start, "h:mm a")} to{" "}
                      {format(selectedSlot.end, "h:mm a")}
                    </p>
                    {selectedSlot.interviewerName && (
                      <p className="text-muted-foreground text-sm">
                        Interviewer: {selectedSlot.interviewerName}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleScheduleInterview}
                    disabled={isScheduling}
                    className="w-full"
                  >
                    {isScheduling ? "Scheduling..." : "Confirm Interview"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
