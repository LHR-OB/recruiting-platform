import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin</h1>
      <div className="grid gap-4">
        <Link href="/admin/users" className="text-blue-600 underline">
          User Management
        </Link>
        <Link href="/admin/events" className="text-blue-600 underline">
          Event Management
        </Link>
        <Link href="/admin/applications" className="text-blue-600 underline">
          Application Review
        </Link>
        <Link href="/admin/systems" className="text-blue-600 underline">
          System/Team Management
        </Link>
      </div>
    </main>
  );
}
