import { getBlacklist, addToBlacklist, removeFromBlacklist } from "./actions";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { auth } from "~/server/auth";

export default async function BlacklistPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Applicant Blacklist</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const blacklist = await getBlacklist();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Applicant Blacklist Management</CardTitle>
          <CardDescription>
            Add or remove EIDs from the blacklist. Blacklisted applicants cannot
            proceed in the application process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={addToBlacklist}
            className="mb-8 flex flex-col gap-4 md:flex-row md:items-end"
          >
            <div className="flex flex-1 flex-col gap-2">
              <label className="font-semibold">EID to Blacklist</label>
              <Input
                name="eid"
                type="text"
                placeholder="e.g. xyz123"
                required
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              className="mt-6 md:mt-0"
            >
              Blacklist EID
            </Button>
          </form>
          <h2 className="mb-2 text-xl font-semibold">
            Currently Blacklisted EIDs
          </h2>
          <div className="overflow-hidden rounded-xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="">
                  <th className="p-2 text-left">EID</th>

                  <th className="p-2 text-left">Created At</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-2 text-center">
                      No blacklisted EIDs.
                    </td>
                  </tr>
                )}
                {blacklist.map((entry) => (
                  <tr key={entry.eid} className="transition">
                    <td className="p-2">{entry.eid}</td>

                    <td className="p-2">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-2">
                      <form action={removeFromBlacklist}>
                        <input type="hidden" name="eid" value={entry.eid} />
                        <Button
                          type="submit"
                          variant="outline"
                          className="bg-green-600 text-white"
                        >
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
