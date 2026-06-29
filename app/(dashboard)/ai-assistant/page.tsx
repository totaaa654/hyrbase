import { getUserContextSummary } from "./actions";
import { ChatInterface } from "@/components/ai-assistant/chat-interface";
import { LastConversationRedirect } from "@/components/ai-assistant/last-conversation-redirect";

export default async function AIAssistantPage() {
  const summary = await getUserContextSummary();

  return (
    <>
      <LastConversationRedirect />
      <ChatInterface conversationId={null} initialMessages={[]} summary={summary} />
    </>
  );
}
