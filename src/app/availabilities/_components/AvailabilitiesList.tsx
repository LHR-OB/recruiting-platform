"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogClose } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type Availability =
  RouterOutputs["availabilities"]["getAvailabilitiesCurrentUser"][number];

export function AvailabilitiesList() {
  const { data: user, isLoading: userLoading } =
    api.users.getCurrentUser.useQuery();
  const {
    data: availabilities,
    isLoading: availLoading,
    error,
    refetch,
  } = api.availabilities.getAvailabilitiesCurrentUser.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: systems } = api.systems.getSystems.useQuery();

  // State for dialog and editing
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Availability | null>(null);
  const [form, setForm] = useState({
    systemId: "",
    start: "",
    end: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mutations
  const createMutation = api.availabilities.createAvailability.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      setForm({ systemId: "", start: "", end: "" });
      void refetch();
    },
  });
  const updateMutation = api.availabilities.updateAvailability.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      setEditing(null);
      setForm({ systemId: "", start: "", end: "" });
      void refetch();
    },
  });
  const deleteMutation = api.availabilities.deleteAvailability.useMutation({
    onMutate: (vars) => setDeletingId(vars.id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => void refetch(),
  });

  const isCreating = createMutation.status === "pending";
  const isUpdating = updateMutation.status === "pending";
  const isDeleting = deleteMutation.status === "pending";
  const createError = createMutation.error;
  const updateError = updateMutation.error;

  // Handlers
  function openAdd() {
    setEditing(null);
    setForm({ systemId: systems?.[0]?.id ?? "", start: "", end: "" });
    setDialogOpen(true);
  }
  function openEdit(a: Availability) {
    setEditing(a);
    setForm({
      systemId: a.systemId,
      start: new Date(a.start).toISOString().slice(0, 16),
      end: new Date(a.end).toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  }
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: { start: new Date(form.start), end: new Date(form.end) },
      });
    } else {
      createMutation.mutate({
        systemId: form.systemId,
        start: new Date(form.start),
        end: new Date(form.end),
      });
    }
  }

  if (userLoading || availLoading) return <div>Loading availabilities...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid gap-4">
      <h2 className="mb-4 text-2xl font-bold">Your Availabilities</h2>
      {availabilities && availabilities.length > 0 ? (
        availabilities.map((a: Availability) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>
                System:{" "}
                {systems?.find((s) => s.id === a.systemId)?.name ?? a.systemId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>Start: {new Date(a.start).toLocaleString()}</div>
              <div>End: {new Date(a.end).toLocaleString()}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openEdit(a)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this availability?",
                      )
                    ) {
                      deleteMutation.mutate({ id: a.id });
                    }
                  }}
                  disabled={isDeleting && deletingId === a.id}
                >
                  {isDeleting && deletingId === a.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div>
          No availabilities set.{" "}
          <Button variant="default" onClick={openAdd}>
            Add Availability
          </Button>
        </div>
      )}
      {/* Add button always visible */}
      <div className="mt-4">
        <Button variant="default" onClick={openAdd}>
          Add Availability
        </Button>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <h3 className="mb-2 text-lg font-semibold">
              {editing ? "Edit" : "Add"} Availability
            </h3>
            <Label htmlFor="systemId">System</Label>
            <select
              id="systemId"
              name="systemId"
              value={form.systemId}
              onChange={handleChange}
              className="rounded border px-2 py-1"
              required
              disabled={!!editing}
            >
              {systems?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Label htmlFor="start">Start</Label>
            <Input
              id="start"
              name="start"
              type="datetime-local"
              value={form.start}
              onChange={handleChange}
              required
            />
            <Label htmlFor="end">End</Label>
            <Input
              id="end"
              name="end"
              type="datetime-local"
              value={form.end}
              onChange={handleChange}
              required
            />
            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={isCreating || isUpdating}>
                {editing
                  ? isUpdating
                    ? "Saving..."
                    : "Save"
                  : isCreating
                    ? "Adding..."
                    : "Add"}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
            {(createError ?? updateError) && (
              <div className="mt-2 text-sm text-red-500">
                {createError?.message ?? updateError?.message}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
