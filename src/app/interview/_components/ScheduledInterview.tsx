"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";

interface ScheduledInterviewProps {
  interview: {
    id: string;
    scheduledAt: Date;
    duration: number;
    location: string | null;
    status: string;
  };
  application: {
    team: {
      name: string;
    };
    cycle: {
      name: string;
    };
  };
  system?: {
    name: string;
  } | null;
}

export function ScheduledInterview({
  interview,
  application,
  system,
}: ScheduledInterviewProps) {
  const interviewDate = new Date(interview.scheduledAt);
  const formattedDate = format(interviewDate, "EEEE, MMMM d, yyyy");
  const formattedTime = format(interviewDate, "h:mm a");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-primary/10 text-primary";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary">Interview Scheduled</CardTitle>
          <Badge className={getStatusColor(interview.status)}>
            {interview.status.charAt(0).toUpperCase() +
              interview.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-primary h-5 w-5" />
          <div>
            <div className="text-foreground font-medium">{formattedDate}</div>
            <div className="text-muted-foreground text-sm">
              at {formattedTime}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <ClockIcon className="text-primary h-5 w-5" />
          <div className="text-muted-foreground text-sm">
            {interview.duration} minutes
          </div>
        </div>

        {/* Team and System */}
        <div className="flex items-center gap-3">
          <UserIcon className="text-primary h-5 w-5" />
          <div>
            <div className="text-foreground font-medium">
              {application.team.name} Team
            </div>
            {system && (
              <div className="text-muted-foreground text-sm">
                {system.name} System
              </div>
            )}
            <div className="text-muted-foreground text-xs">
              {application.cycle.name}
            </div>
          </div>
        </div>

        {/* Location */}
        {interview.location && (
          <div className="flex items-center gap-3">
            <MapPinIcon className="text-primary h-5 w-5" />
            <div className="text-muted-foreground text-sm">
              {interview.location}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-muted mt-4 rounded-lg p-3">
          <p className="text-muted-foreground text-sm">
            Your interview is confirmed! Please arrive on time and prepare any
            questions you may have about the{" "}
            {system ? system.name + " system" : "team"}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
