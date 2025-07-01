import type { InferSelectModel } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { schema } from "~/server/db";

export function ApplicationList({
  applications,
}: {
  applications: InferSelectModel<(typeof schema)["applications"]>[];
}) {
  return (
    <div className="grid gap-4">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader>
            <CardTitle>Application #{app.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Status: {app.status}</div>
            <div>Team: {app.teamId}</div>
            <div>System: {app.systemId}</div>
            <div>Submitted: {new Date(app.createdAt).toLocaleString()}</div>
            <Button variant="outline">View</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
