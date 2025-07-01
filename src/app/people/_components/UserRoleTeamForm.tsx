"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DialogFooter, DialogClose } from "~/components/ui/dialog";
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "~/server/db/schema";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
}

interface Session {
  user: {
    role: string;
  };
}

export default function UserRoleTeamForm({
  user,
  teams,
  roleOptions,
  session,
  onSubmit,
}: {
  user: Pick<InferSelectModel<typeof users>, "id" | "role" | "teamId">;
  teams: Team[];
  roleOptions: string[];
  session: Session;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [role, setRole] = useState<typeof user.role>(user.role);
  const [teamId, setTeamId] = useState(user.teamId ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    setLoading(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="mb-1 block">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof user.role)}
          className="w-full rounded border px-2 py-1"
        >
          {roleOptions.map((roleOption) => (
            <option
              key={roleOption}
              value={roleOption}
              disabled={roleOption === "ADMIN" && session.user.role !== "ADMIN"}
            >
              {roleOption}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="mb-1 block">Team</label>
        <select
          name="teamId"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full rounded border px-2 py-1"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
}
