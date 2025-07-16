import { InterviewBookingCalendar } from "./_components/InterviewBookingCalendar";
import { getBookingAvailabilities, getSystems, getTeams } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function BookInterviewPage() {
  try {
    const [availabilities, systems, teams] = await Promise.all([
      getBookingAvailabilities(),
      getSystems(),
      getTeams(),
    ]);

    return (
      <main className="container mx-auto py-8">
        <h1 className="mb-6 text-3xl font-bold">Book Interview</h1>
        <div className="grid gap-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              Select Interview Slot
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose a 30-minute interview slot from the available times.
              {systems.length > 1 ? (
                <span className="mt-2 block text-sm font-medium text-orange-600 dark:text-orange-400">
                  Note: You can interview for multiple systems because you
                  applied for Solar.
                </span>
              ) : (
                <span className="mt-2 block text-sm">
                  You can interview for your top system preference.
                </span>
              )}
            </p>
            <InterviewBookingCalendar
              availabilities={availabilities}
              systems={systems}
              teams={teams}
            />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied";

    return (
      <main className="container mx-auto py-8">
        <h1 className="mb-6 text-3xl font-bold">Book Interview</h1>
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
              <p className="mb-2">Interview booking is only available:</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  During the interview stage of an active application cycle
                </li>
                <li>For applicants with a valid application</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
}
