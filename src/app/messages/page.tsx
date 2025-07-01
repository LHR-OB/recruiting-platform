"use client";

import { useState } from "react";
import { api } from "~/trpc/react"; // Corrected import
import MessagesList from "./_components/MessagesList";
import MessageView from "./_components/MessageView";

// Shadcn/ui components
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"; // Corrected import
import { Loader2 } from "lucide-react";

// Define a basic type for a message based on your tRPC router schema
interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  isRead?: boolean;
  subject?: string;
  senderName?: string;
}

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const {
    data: messages,
    isLoading,
    error,
    refetch,
  } = api.messages.getMessagesCurrentUser.useQuery(undefined, {
    select: (data) =>
      data
        ? ([...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ) as Message[])
        : [],
  });

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error fetching messages: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Messages</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="mb-4 text-2xl font-semibold">Inbox</h2>
          {messages && messages.length > 0 ? (
            <MessagesList
              messages={messages}
              selectedMessage={selectedMessage}
              onSelectMessage={handleSelectMessage}
              refetchMessages={refetch}
            />
          ) : (
            <p className="mt-2 italic">You have no messages.</p>
          )}
        </div>
        <div className="md:col-span-2">
          <h2 className="mb-4 text-2xl font-semibold">Message Details</h2>
          {selectedMessage ? (
            <MessageView message={selectedMessage} />
          ) : (
            <p className="mt-2 italic">Select a message to view its content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
