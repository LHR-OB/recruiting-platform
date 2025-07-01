"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const roleOptions = [
  "APPLICANT",
  "MEMBER",
  "TEAM_MANAGEMENT",
  "ADMIN",
] as const;

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = api.users.getUsersMembers.useQuery();
  const updateMutation = api.users.updateUser.useMutation({
    onSuccess: () => void refetch(),
  });
  const deleteMutation = api.users.deleteUser.useMutation({
    onSuccess: () => void refetch(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", teamId: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const s = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.name?.toLowerCase().includes(s) ?? false) ||
        (u.email?.toLowerCase().includes(s) ?? false) ||
        (u.role?.toLowerCase().includes(s) ?? false) ||
        (u.teamId?.toLowerCase().includes(s) ?? false),
    );
  }, [users, search]);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>
      <div className="mb-4">
        <Input
          placeholder="Search by name, email, role, or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-4">
        {filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle>{u.name ?? u.email}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Email: {u.email}</div>
                <div>Role: {u.role}</div>
                <div>Team: {u.teamId ?? "None"}</div>
                {editingId === u.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({
                        userIdToUpdate: u.id,
                        data: {
                          name: editForm.name,
                          role: editForm.role as (typeof roleOptions)[number],
                          teamId: editForm.teamId || null,
                        },
                      });
                    }}
                    className="mt-2 flex flex-col gap-2"
                  >
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          role: e.target.value as (typeof roleOptions)[number],
                        }))
                      }
                      className="rounded border px-2 py-1"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <Label htmlFor="teamId">Team</Label>
                    <Input
                      id="teamId"
                      value={editForm.teamId}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, teamId: e.target.value }))
                      }
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateMutation.status === "pending"}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                    {updateMutation.error && (
                      <div className="text-sm text-red-500">
                        {updateMutation.error.message}
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(u.id);
                        setEditForm({
                          name: u.name ?? "",
                          role: u.role,
                          teamId: u.teamId ?? "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={
                        deletingId === u.id &&
                        deleteMutation.status === "pending"
                      }
                      onClick={() => {
                        if (confirm("Delete this user?")) {
                          setDeletingId(u.id);
                          deleteMutation.mutate({ userIdToDelete: u.id });
                        }
                      }}
                    >
                      {deletingId === u.id &&
                      deleteMutation.status === "pending"
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div>No users found.</div>
        )}
      </div>
    </main>
  );
}
