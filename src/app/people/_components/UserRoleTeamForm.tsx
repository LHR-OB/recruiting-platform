"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DialogFooter, DialogClose } from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "~/server/db/schema";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
}

interface System {
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
  systems,
  roleOptions,
  session,
  onSubmit,
}: {
  user: Pick<InferSelectModel<typeof users>, "id" | "role" | "teamId">;
  teams: Team[];
  systems: Record<string, System[]>;
  roleOptions: string[];
  session: Session;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [role, setRole] = useState<typeof user.role>(user.role);
  const [teamId, setTeamId] = useState(user.teamId ?? "");
  const [systemId, setSystemId] = useState("");
  const [loading, setLoading] = useState(false);

  // Get systems for the selected team
  const availableSystems = teamId ? (systems[teamId] ?? []) : [];
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("role", role);
    formData.append("teamId", teamId);
    formData.append("systemId", systemId);
    await onSubmit(formData);
    setLoading(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="mb-1 block">Role</label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as typeof user.role)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((roleOption) => (
              <SelectItem
                key={roleOption}
                value={roleOption}
                disabled={
                  roleOption === "ADMIN" && session.user.role !== "ADMIN"
                }
              >
                {roleOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <label className="mb-1 block">Team</label>
        <Select
          value={teamId}
          onValueChange={(value) => {
            setTeamId(value);
            setSystemId(""); // Reset system selection when team changes
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block">System</label>
        <Select
          value={systemId}
          onValueChange={setSystemId}
          disabled={!teamId || availableSystems.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={!teamId ? "Select a team first" : "Select a system"}
            />
          </SelectTrigger>
          <SelectContent>
            {availableSystems.map((system) => (
              <SelectItem key={system.id} value={system.id}>
                {system.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
