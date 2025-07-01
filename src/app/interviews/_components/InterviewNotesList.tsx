"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

// Type for interview note
export type InterviewNote =
  RouterOutputs["interviewNotes"]["getInterviewNotesByInterview"][number];

export function InterviewNotesList({ interviewId }: { interviewId: string }) {
  const {
    data: notes,
    isLoading,
    error,
    refetch,
  } = api.interviewNotes.getInterviewNotesByInterview.useQuery({ interviewId });
  const [note, setNote] = useState("");
  const createMutation = api.interviewNotes.createInterviewNote.useMutation({
    onSuccess: () => {
      setNote("");
      void refetch();
    },
  });

  // Fix: mutation loading state
  const isCreating = createMutation.status === "pending";

  // Add state for editing and deleting
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mutations for update and delete
  const updateMutation = api.interviewNotes.updateInterviewNote.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditValue("");
      void refetch();
    },
  });
  const deleteMutation = api.interviewNotes.deleteInterviewNote.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      void refetch();
    },
  });
  const isUpdating = updateMutation.status === "pending";
  const isDeleting = deleteMutation.status === "pending";

  if (isLoading) return <div>Loading notes...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="mt-2 space-y-2">
      <h4 className="font-semibold">Notes</h4>
      {notes && notes.length > 0 ? (
        notes.map((note) => (
          <Card key={note.id} className="p-2">
            <CardContent>
              {editingId === note.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate({
                      id: note.id,
                      data: { note: editValue },
                    });
                  }}
                  className="flex flex-col gap-2"
                >
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={isUpdating}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isUpdating || !editValue.trim()}
                    >
                      {isUpdating ? "Saving..." : "Save"}
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
                <>
                  <div className="text-sm whitespace-pre-line">{note.note}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    By: {note.createdById}
                  </div>
                  <div className="mt-1 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditValue(note.note);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this note?"))
                          deleteMutation.mutate({ id: note.id });
                      }}
                      disabled={isDeleting && deletingId === note.id}
                    >
                      {isDeleting && deletingId === note.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-muted-foreground text-sm">No notes yet.</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) {
            createMutation.mutate({ interviewId, note });
          }
        }}
        className="mt-2 flex flex-col gap-2"
      >
        <Label htmlFor="note-input">Add Note</Label>
        <Input
          id="note-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note..."
          disabled={isCreating}
        />
        <Button type="submit" disabled={isCreating || !note.trim()}>
          {isCreating ? "Adding..." : "Add Note"}
        </Button>
        {createMutation.error && (
          <div className="text-sm text-red-500">
            {createMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
