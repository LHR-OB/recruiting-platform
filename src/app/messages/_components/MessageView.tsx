"use client";

// Shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"; // Corrected import
import { Separator } from "~/components/ui/separator"; // Corrected import

interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  isRead?: boolean;
  subject?: string;
  senderName?: string;
}

interface MessageViewProps {
  message: Message | null;
}

export default function MessageView({ message }: MessageViewProps) {
  if (!message) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground italic">
            Select a message to view its content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        {/* Used nullish coalescing operator */}
        <CardTitle>{message.subject ?? "Message Details"}</CardTitle>
        <div className="text-muted-foreground space-y-1 pt-1 text-sm">
          {/* Used nullish coalescing operator */}
          <p>From: {message.senderName ?? message.userId}</p>
          <p>Received: {new Date(message.createdAt).toLocaleString()}</p>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-grow pt-4">
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </CardContent>
    </Card>
  );
}
