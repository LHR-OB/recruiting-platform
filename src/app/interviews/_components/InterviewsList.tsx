import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { InterviewNotesList } from "./InterviewNotesList";

// Type for interview
type Interview = RouterOutputs["interviews"]["getInterviewsByUser"][number];

export function InterviewsList() {
  const { data: user, isLoading: userLoading } =
    api.users.getCurrentUser.useQuery();
  // Only fetch if user is loaded
  const userId = user?.id;
  const {
    data: interviews,
    isLoading,
    error,
  } = api.interviews.getInterviewsByUser.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId },
  );

  if (userLoading || isLoading) return <div>Loading interviews...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid gap-4">
      <h2 className="mb-4 text-2xl font-bold">Your Interviews</h2>
      {interviews && interviews.length > 0 ? (
        interviews.map((i: Interview) => (
          <Card key={i.id}>
            <CardHeader>
              <CardTitle>
                Interview for Application: {i.applicationId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>Event: {i.eventId}</div>
              <div>Created: {new Date(i.createdAt).toLocaleString()}</div>
              <InterviewNotesList interviewId={i.id} />
              {/* TODO: Add more details, edit/review actions */}
            </CardContent>
          </Card>
        ))
      ) : (
        <div>No interviews scheduled.</div>
      )}
    </div>
  );
}
