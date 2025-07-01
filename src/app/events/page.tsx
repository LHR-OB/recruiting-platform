import { EventsList } from "./_components/EventsList";

export default function EventsPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Events</h1>
      <EventsList />
    </main>
  );
}
