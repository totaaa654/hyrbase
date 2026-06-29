import { getConversations } from "./actions";
import { AIAssistantShell } from "@/components/ai-assistant/ai-assistant-shell";

export default async function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversations = await getConversations();

  return (
    <AIAssistantShell conversations={conversations}>
      {children}
    </AIAssistantShell>
  );
}
