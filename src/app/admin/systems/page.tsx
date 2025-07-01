"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminSystemsPage() {
  const { data: systems, isLoading, error } = api.systems.getSystems.useQuery();

  if (isLoading) return <div>Loading systems...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">System/Team Management</h1>
      <div className="grid gap-4">
        {systems && systems.length > 0 ? (
          systems.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Description: {s.description}</div>
                <div>Team: {s.teamId}</div>
                {/* TODO: Add edit, delete, manage users actions */}
              </CardContent>
            </Card>
          ))
        ) : (
          <div>No systems found.</div>
        )}
      </div>
    </main>
  );
}
