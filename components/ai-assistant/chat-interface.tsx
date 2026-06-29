"use client";

import { useRef, useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageBubble } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { sendMessage } from "@/app/(dashboard)/ai-assistant/actions";
import type { ChatMessage, UserContextSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

const LAST_CONV_KEY = "hyrbase_last_conversation";
const SCROLL_KEY = (id: string) => `hyrbase_scroll_${id}`;

// ── Quick chips (welcome state only) ─────────────────────────────────────────

const QUICK_CHIPS = [
  { label: "Summarize my applications", message: "Give me a summary of all my job applications and their current statuses." },
  { label: "What skills am I missing?", message: "Across all my applications, what skills am I missing most frequently?" },
  { label: "Interview prep", message: "Help me prepare for my upcoming interview with common questions based on my job description." },
  { label: "Write a follow-up email", message: "Write a professional follow-up email for my most recent application." },
  { label: "Compare my resumes", message: "Compare my uploaded resumes and tell me which one is strongest and why." },
  { label: "Resume tips", message: "Review my resume performance and give me specific tips to improve my ATS scores." },
  { label: "Salary negotiation", message: "I need help with salary negotiation. What should I say and what strategy should I use?" },
];

// ── Client-side intent detection (for context indicator only) ─────────────────

type IntentLabel = {
  icon: string;
  label: string;
  isGeneral: boolean;
};

function detectClientIntent(input: string): IntentLabel {
  if (!input.trim()) return { icon: "🌐", label: "General", isGeneral: true };

  if (/(how many|count|total|number of).*(application|job)/i.test(input))
    return { icon: "📊", label: "Application Count", isGeneral: false };

  if (/missing skill|skill gap|common skill/i.test(input))
    return { icon: "🔍", label: "Skill Gaps", isGeneral: false };

  if (/(interview.*question|prepare.*interview|mock interview)/i.test(input)) {
    const m = input.match(/(?:for|at|with)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    return { icon: "💼", label: m?.[1] ? `Interview · ${m[1]}` : "Interview Prep", isGeneral: false };
  }

  if (/follow.?up.*(email|message)|write.*email/i.test(input)) {
    const m = input.match(/(?:for|to|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    return { icon: "📧", label: m?.[1] ? `Follow-up · ${m[1]}` : "Follow-up Email", isGeneral: false };
  }

  if (/compare.*(resume|cv)|(resume|cv).*(compare|review|improve|tip|score)/i.test(input))
    return { icon: "📄", label: "Resume Analysis", isGeneral: false };

  if (/(all|my|list|pending|active|applied|summarize|overview|status).*(application|job)/i.test(input) ||
      /prioritize/i.test(input))
    return { icon: "📋", label: "All Applications", isGeneral: false };

  // Company name mentioned
  const patterns = [
    /(?:for|at|with|from)\s+([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:application|interview|position|job|role)/i,
    /([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:application|interview|position|job|role)/i,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m?.[1]) return { icon: "🏢", label: m[1], isGeneral: false };
  }

  return { icon: "🌐", label: "General", isGeneral: true };
}

// ── Welcome state ─────────────────────────────────────────────────────────────

function WelcomeState({
  onChipClick,
  disabled,
}: {
  onChipClick: (msg: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Bot className="size-7 text-primary" />
      </div>
      <h2 className="mb-2 text-base font-semibold text-foreground">AI Career Assistant</h2>
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        I have access to your HyrBase data — applications, resumes, and AI analyses — for personalized career advice.
      </p>
      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onChipClick(chip.message)}
            disabled={disabled}
            className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Context indicator ─────────────────────────────────────────────────────────

function ContextIndicator({
  input,
  isIgnored,
  onIgnore,
  onClear,
}: {
  input: string;
  isIgnored: boolean;
  onIgnore: () => void;
  onClear: () => void;
}) {
  const [debouncedInput, setDebouncedInput] = useState(input);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(t);
  }, [input]);

  if (!debouncedInput.trim()) return null;

  const ctx = isIgnored
    ? { icon: "🌐", label: "General (context cleared)", isGeneral: true }
    : detectClientIntent(debouncedInput);

  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
          ctx.isGeneral
            ? "border-border bg-muted/50 text-muted-foreground"
            : "border-primary/20 bg-primary/5 text-primary"
        )}
      >
        <span>{ctx.icon}</span>
        <span>{ctx.label}</span>
        {!ctx.isGeneral && !isIgnored && (
          <button
            onClick={onIgnore}
            className="ml-0.5 text-muted-foreground hover:text-foreground"
            title="Don't fetch related data for this message"
          >
            <X className="size-2.5" />
          </button>
        )}
        {isIgnored && (
          <button
            onClick={onClear}
            className="ml-0.5 text-muted-foreground hover:text-foreground"
            title="Restore context"
          >
            <X className="size-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  conversationId: string | null;
  initialMessages: ChatMessage[];
  summary: UserContextSummary | null;
}

export function ChatInterface({ conversationId, initialMessages, summary }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [forceGeneral, setForceGeneral] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRestoringScroll = useRef(false);

  // Save last opened conversation
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(LAST_CONV_KEY, conversationId);
    }
  }, [conversationId]);

  // Reset messages when route changes (new conversation loaded)
  useEffect(() => {
    setMessages(initialMessages);
    setError(null);
    setForceGeneral(false);
    setInput("");
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position when conversation loads
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !conversationId) return;
    const saved = localStorage.getItem(SCROLL_KEY(conversationId));
    if (saved) {
      isRestoringScroll.current = true;
      container.scrollTop = parseInt(saved, 10);
      // Give a tick for layout to settle
      requestAnimationFrame(() => { isRestoringScroll.current = false; });
    }
  }, [conversationId]);

  // Save scroll position on scroll (throttled)
  const saveScroll = useCallback(() => {
    if (!conversationId || isRestoringScroll.current) return;
    const container = scrollRef.current;
    if (container) {
      localStorage.setItem(SCROLL_KEY(conversationId), String(container.scrollTop));
    }
  }, [conversationId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", saveScroll, { passive: true });
    return () => container.removeEventListener("scroll", saveScroll);
  }, [saveScroll]);

  // Auto-scroll to bottom on new messages (but not on initial load if restoring scroll)
  useEffect(() => {
    if (!isRestoringScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isPending]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  function handleSend(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || isPending) return;

    setInput("");
    setError(null);
    const usedForceGeneral = forceGeneral;
    setForceGeneral(false);

    const now = new Date().toISOString();
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: text,
      created_at: now,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    startTransition(async () => {
      const result = await sendMessage(text, conversationId, summary, usedForceGeneral);

      if ("error" in result) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError(result.error);
        return;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        optimisticMsg,
        aiMsg,
      ]);

      // New conversation: navigate to its URL
      if (!conversationId) {
        router.replace(`/ai-assistant/${result.conversationId}`);
        return;
      }

      // Title generated: refresh sidebar
      if (result.generatedTitle) {
        router.refresh();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Message list ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <WelcomeState onChipClick={handleSend} disabled={isPending} />
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {isPending && <TypingIndicator />}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
        {showWelcome && <div ref={bottomRef} />}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <ContextIndicator
            input={input}
            isIgnored={forceGeneral}
            onIgnore={() => setForceGeneral(true)}
            onClear={() => setForceGeneral(false)}
          />
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your job search..."
              rows={1}
              className="max-h-40 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              disabled={isPending}
            />
            <Button
              size="icon"
              className="size-7 shrink-0"
              onClick={() => handleSend()}
              disabled={!input.trim() || isPending}
            >
              <SendHorizonal className="size-3.5" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
            Enter to send · Shift+Enter for new line · Gemini may make mistakes
          </p>
        </div>
      </div>
    </div>
  );
}
