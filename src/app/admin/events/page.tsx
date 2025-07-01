"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";

export default function AdminEventsPage() {
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = api.events.getEvents.useQuery();
  const deleteMutation = api.events.deleteEvent.useMutation({
    onSuccess: () => void refetch(),
  });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [manageEventId, setManageEventId] = useState<string | null>(null);
  const [addUserId, setAddUserId] = useState("");
  const usersForEvent = api.events.getUsersForEvent.useQuery(
    { eventId: manageEventId ?? "" },
    { enabled: !!manageEventId },
  );
  const allUsers = api.users.getUsersMembers.useQuery();
  const addUserMutation = api.events.addUserToEvent.useMutation({
    onSuccess: () => usersForEvent.refetch(),
  });
  const removeUserMutation = api.events.removeUserFromEvent.useMutation({
    onSuccess: () => usersForEvent.refetch(),
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const s = search.toLowerCase();
    return events.filter(
      (e) =>
        (e.name?.toLowerCase().includes(s) ?? false) ||
        (e.description?.toLowerCase().includes(s) ?? false) ||
        (e.location?.toLowerCase().includes(s) ?? false),
    );
  }, [events, search]);
  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id),
    );
  };
  const handleBulkDelete = () => {
    selected.forEach((id) => deleteMutation.mutate({ id }));
    setSelected([]);
  };

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Event Management</h1>
      <div className="mb-4 flex flex-col gap-2">
        <Input
          placeholder="Search by name, description, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              Bulk Delete
            </Button>
            <span className="text-muted-foreground text-xs">
              {selected.length} selected
            </span>
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((e) => (
            <Card key={e.id}>
              <CardHeader className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={selected.includes(e.id)}
                  onCheckedChange={(checked: boolean) =>
                    handleSelect(e.id, !!checked)
                  }
                />
                <CardTitle>{e.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Description: {e.description}</div>
                <div>Start: {new Date(e.startTime).toLocaleString()}</div>
                <div>End: {new Date(e.endTime).toLocaleString()}</div>
                <div>Location: {e.location}</div>
                <div className="mt-2 flex gap-2">
                  <Dialog
                    open={manageEventId === e.id}
                    onOpenChange={(open) =>
                      setManageEventId(open ? e.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        Manage Users
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <h3 className="mb-2 font-semibold">Users in Event</h3>
                      {usersForEvent.isLoading ? (
                        <div>Loading users...</div>
                      ) : usersForEvent.data &&
                        usersForEvent.data.length > 0 ? (
                        <ul className="mb-2">
                          {usersForEvent.data.map((user) => (
                            <li
                              key={user.id}
                              className="flex items-center gap-2"
                            >
                              <span>{user.name ?? user.email ?? user.id}</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  removeUserMutation.mutate({
                                    eventId: e.id,
                                    userId: user.id,
                                  })
                                }
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No users in this event.</div>
                      )}
                      <form
                        onSubmit={(ev) => {
                          ev.preventDefault();
                          if (addUserId.trim()) {
                            addUserMutation.mutate({
                              eventId: e.id,
                              userId: addUserId,
                            });
                            setAddUserId("");
                          }
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="User ID to add"
                          value={addUserId}
                          onChange={(ev) => setAddUserId(ev.target.value)}
                          list="all-users"
                        />
                        <datalist id="all-users">
                          {allUsers.data?.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ?? u.email}
                            </option>
                          ))}
                        </datalist>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addUserMutation.status === "pending"}
                        >
                          Add User
                        </Button>
                      </form>
                      {addUserMutation.error && (
                        <div className="text-sm text-red-500">
                          {addUserMutation.error.message}
                        </div>
                      )}
                      {removeUserMutation.error && (
                        <div className="text-sm text-red-500">
                          {removeUserMutation.error.message}
                        </div>
                      )}
                      <DialogClose asChild>
                        <Button variant="outline" className="mt-2">
                          Close
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div>No events found.</div>
        )}
      </div>
    </main>
  );
}
