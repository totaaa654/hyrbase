"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatMessage;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Bubble */}
      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="w-full border-collapse text-xs">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted/50 px-2 py-1 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-2 py-1">{children}</td>
                ),
                // Code
                code: ({ className, children, ...props }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code
                        className={cn(
                          "block rounded-md bg-background/60 p-3 font-mono text-xs overflow-x-auto",
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-2 overflow-hidden rounded-md bg-background/60">
                    {children}
                  </pre>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                // Headings
                h1: ({ children }) => (
                  <h1 className="mt-3 mb-1 text-base font-bold">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-3 mb-1 text-sm font-bold">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-2 mb-0.5 text-sm font-semibold">{children}</h3>
                ),
                // Paragraph
                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                // Bold / italic
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                // Blockquote
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                // HR
                hr: () => <hr className="my-2 border-border" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        </div>
        {message.created_at && (
          <span className="px-1 text-[10px] text-muted-foreground/50">
            {formatTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}
