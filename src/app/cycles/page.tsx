import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { CyclesManagement } from "./_components/CyclesManagement";
import { getCycles } from "./actions";

export default async function CyclesPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return notFound();
  }

  const cycles = await getCycles();

  return (
    <>
      <div className="pb-8">
        <h1 className="text-2xl font-medium">Application Cycles</h1>
        <p className="text-muted-foreground">
          Manage application cycles and their stage timelines. Create new cycles
          and adjust the timing of each stage.
        </p>
      </div>
      <div className="absolute left-0 container mx-auto border-b" />
      <CyclesManagement cycles={cycles} />
    </>
  );
}
