import { notFound } from "next/navigation";
import { getConversationMessages, getUserContextSummary } from "../actions";
import { ChatInterface } from "@/components/ai-assistant/chat-interface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;

  const [messages, summary] = await Promise.all([
    getConversationMessages(id),
    getUserContextSummary(),
  ]);

  if (messages === null) notFound();

  return (
    <ChatInterface
      conversationId={id}
      initialMessages={messages}
      summary={summary}
    />
  );
}
