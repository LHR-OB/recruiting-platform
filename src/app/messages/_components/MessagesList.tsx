"use client";

import { api } from "~/trpc/react";

// Shadcn/ui components
import { Button } from "~/components/ui/button"; // Corrected import
import { ScrollArea } from "~/components/ui/scroll-area"; // Corrected import
import { cn } from "~/lib/utils"; // Corrected import
import { Badge } from "~/components/ui/badge"; // Corrected import

interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  isRead?: boolean;
  subject?: string;
  senderName?: string;
}

interface MessagesListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  refetchMessages: () => void; // To refetch messages after marking as read
}

export default function MessagesList({
  messages,
  selectedMessage,
  onSelectMessage,
  refetchMessages,
}: MessagesListProps) {
  const markAsReadMutation = api.messages.readMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
    },
    onError: (error) => {
      console.error("Failed to mark message as read:", error);
    },
  });

  const handleSelectAndRead = (message: Message) => {
    onSelectMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate({ id: message.id });
    }
  };

  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-2">
      {" "}
      {/* Adjust height as needed */}
      <div className="space-y-1">
        {messages.map((message) => (
          <Button
            key={message.id}
            variant={selectedMessage?.id === message.id ? "secondary" : "ghost"}
            className={cn(
              "h-auto w-full justify-start px-4 py-3 text-left",
              !message.isRead && "font-bold",
            )}
            onClick={() => handleSelectAndRead(message)}
          >
            <div className="flex w-full flex-col">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-sm">
                  {message.subject ??
                    `Message from ${message.senderName ?? message.userId}`}
                </span>
                {!message.isRead && (
                  <Badge variant="default" className="ml-2 text-xs">
                    New
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                Received: {new Date(message.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
