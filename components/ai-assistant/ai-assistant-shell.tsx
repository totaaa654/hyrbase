"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationSidebar } from "./conversation-sidebar";
import type { AIConversation } from "@/types/chat";

const STORAGE_KEY = "hyrbase_conv_sidebar_collapsed";

interface Props {
  conversations: AIConversation[];
  children: React.ReactNode;
}

export function AIAssistantShell({ conversations, children }: Props) {
  // We defer reading localStorage until after hydration to avoid SSR mismatch
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsCollapsed(true);
    setHydrated(true);
  }, []);

  function toggleCollapse() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <ConversationSidebar
        conversations={conversations}
        isCollapsed={hydrated ? isCollapsed : false}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">AI Career Assistant</span>
        </div>
        {children}
      </div>
    </div>
  );
}
