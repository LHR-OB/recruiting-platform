import { AvailabilityCalendar } from "./_components/AvailabilityCalendar";
import {
  getAvailabilities,
  getSystems,
  getOthersAvailabilities,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function InterviewsPage() {
  try {
    const [availabilities, systems, othersAvailabilities] = await Promise.all([
      getAvailabilities(),
      getSystems(),
      getOthersAvailabilities(),
    ]);

    return (
      <main className="container mx-auto py-8">
        <h1 className="mb-6 text-3xl font-bold">Interview Availability</h1>
        <div className="grid gap-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              Set Your Availability
            </h2>
            <p className="text-muted-foreground mb-6">
              Select the days you&apos;re available for interviews and specify
              your time preferences.
            </p>
            <AvailabilityCalendar
              initialAvailabilities={availabilities}
              othersAvailabilities={othersAvailabilities}
              systems={systems}
            />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied";

    return (
      <main className="container mx-auto py-8">
        <h1 className="mb-6 text-3xl font-bold">Interview Availability</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{message}</p>
            <div className="text-muted-foreground mt-4 text-sm">
              <p className="mb-2">This page is only available to:</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Team Management</li>
                <li>System Leaders</li>
                <li>Administrators</li>
              </ul>
              <p className="mt-4">
                And only during the interview stage of an active application
                cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
}
