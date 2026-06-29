export interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface UserContextSummary {
  appCount: number;
  statusBreakdown: Record<string, number>;
  resumeCount: number;
  defaultResume: string | null;
}
