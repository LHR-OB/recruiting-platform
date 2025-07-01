"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";

export default function AdminApplicationsPage() {
  const {
    data: applications,
    isLoading,
    error,
    refetch,
  } = api.applications.getApplications.useQuery();
  const updateMutation = api.applications.updateApplication.useMutation({
    onSuccess: () => void refetch(),
  });
  const deleteMutation = api.applications.deleteApplication.useMutation({
    onSuccess: () => void refetch(),
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    const s = search.toLowerCase();
    return applications.filter(
      (a) =>
        (a.userId?.toLowerCase().includes(s) ?? false) ||
        (a.systemId?.toLowerCase().includes(s) ?? false) ||
        (a.status?.toLowerCase().includes(s) ?? false) ||
        (a.id?.toLowerCase().includes(s) ?? false),
    );
  }, [applications, search]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id),
    );
  };
  const handleBulkAction = (action: "APPROVED" | "REJECTED" | "DELETE") => {
    if (action === "DELETE") {
      setBulkDeleting(true);
      void Promise.all(
        selected.map(
          (id) =>
            new Promise((resolve) => {
              deleteMutation.mutate({ id }, { onSettled: resolve });
            }),
        ),
      ).finally(() => {
        setBulkDeleting(false);
        setSelected([]);
      });
    } else {
      selected.forEach((id) =>
        updateMutation.mutate({ id, data: { status: action } }),
      );
      setSelected([]);
    }
  };

  if (isLoading) return <div>Loading applications...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Application Review</h1>
      <div className="mb-4 flex flex-col gap-2">
        <Input
          placeholder="Search by user, system, status, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleBulkAction("APPROVED")}>
              Bulk Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("REJECTED")}
            >
              Bulk Reject
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction("DELETE")}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Deleting..." : "Bulk Delete"}
            </Button>
            <span className="text-muted-foreground text-xs">
              {selected.length} selected
            </span>
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {filteredApplications && filteredApplications.length > 0 ? (
          filteredApplications.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={selected.includes(a.id)}
                  onCheckedChange={(checked: boolean) =>
                    handleSelect(a.id, !!checked)
                  }
                />
                <CardTitle>Application: {a.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>User: {a.userId}</div>
                <div>System: {a.systemId}</div>
                <div>Status: {a.status}</div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={updateMutation.status === "pending"}
                    onClick={() =>
                      updateMutation.mutate({
                        id: a.id,
                        data: { status: "APPROVED" },
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateMutation.status === "pending"}
                    onClick={() =>
                      updateMutation.mutate({
                        id: a.id,
                        data: { status: "REJECTED" },
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={
                      deletingId === a.id && deleteMutation.status === "pending"
                    }
                    onClick={() => {
                      if (confirm("Delete this application?")) {
                        setDeletingId(a.id);
                        deleteMutation.mutate({ id: a.id });
                      }
                    }}
                  >
                    {deletingId === a.id && deleteMutation.status === "pending"
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>
                {updateMutation.error && (
                  <div className="text-sm text-red-500">
                    {updateMutation.error.message}
                  </div>
                )}
                {deleteMutation.error && (
                  <div className="text-sm text-red-500">
                    {deleteMutation.error.message}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div>No applications found.</div>
        )}
      </div>
    </main>
  );
}
