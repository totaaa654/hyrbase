"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SquarePen,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { renameConversation, deleteConversation } from "@/app/(dashboard)/ai-assistant/actions";
import type { AIConversation } from "@/types/chat";
import { cn } from "@/lib/utils";

const LAST_CONV_KEY = "hyrbase_last_conversation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupConversations(convs: AIConversation[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  const today: AIConversation[] = [];
  const yesterday: AIConversation[] = [];
  const week: AIConversation[] = [];
  const older: AIConversation[] = [];

  for (const c of convs) {
    const d = new Date(c.updated_at);
    if (d >= todayStart) today.push(c);
    else if (d >= yesterdayStart) yesterday.push(c);
    else if (d >= weekStart) week.push(c);
    else older.push(c);
  }

  return { today, yesterday, week, older };
}

// ── Conversation item ─────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  isCollapsed,
  onUpdate,
}: {
  conv: AIConversation;
  isActive: boolean;
  isCollapsed: boolean;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conv.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === conv.title) {
      setIsRenaming(false);
      setRenameValue(conv.title);
      return;
    }
    setIsPending(true);
    await renameConversation(conv.id, trimmed);
    setIsPending(false);
    setIsRenaming(false);
    onUpdate();
  }

  async function handleDelete() {
    setIsPending(true);
    // Clear localStorage if this was the last opened conversation
    if (typeof window !== "undefined" &&
        localStorage.getItem(LAST_CONV_KEY) === conv.id) {
      localStorage.removeItem(LAST_CONV_KEY);
    }
    await deleteConversation(conv.id);
    setIsPending(false);
    setShowDeleteDialog(false);
    if (isActive) router.push("/ai-assistant");
    onUpdate();
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-1.5">
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") {
              setIsRenaming(false);
              setRenameValue(conv.title);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none"
        />
        <button
          onClick={handleRenameSubmit}
          disabled={isPending}
          className="shrink-0 text-primary hover:text-primary/80"
        >
          <Check className="size-3" />
        </button>
        <button
          onClick={() => { setIsRenaming(false); setRenameValue(conv.title); }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  // Collapsed: show only a dot/icon with tooltip
  if (isCollapsed) {
    return (
      <Link
        href={`/ai-assistant/${conv.id}`}
        title={conv.title}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <MessageSquare className="size-4 shrink-0" />
      </Link>
    );
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
        )}
      >
        <Link href={`/ai-assistant/${conv.id}`} className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium leading-snug">{conv.title}</span>
          <span className="text-[10px] text-muted-foreground">{relativeTime(conv.updated_at)}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                isActive && "opacity-100"
              )}
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{conv.title}&rdquo; and all its messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Shared sidebar content ────────────────────────────────────────────────────

function SidebarContent({
  conversations,
  activeId,
  isCollapsed,
  onToggleCollapse,
  onClose,
}: {
  conversations: AIConversation[];
  activeId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
}) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  const groups = groupConversations(conversations);
  const isEmpty = conversations.length === 0;

  return (
    <>
      {/* Header row: new chat + collapse button */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 px-2 pt-3 pb-2",
          isCollapsed ? "flex-col" : "flex-row"
        )}
      >
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          className={cn(
            "shrink-0",
            isCollapsed ? "size-9" : "flex-1 justify-start gap-2 text-sm"
          )}
          title="New Chat"
          asChild
        >
          <Link href="/ai-assistant" onClick={onClose}>
            <SquarePen className="size-4 shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isEmpty ? (
          !isCollapsed && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <MessageSquare className="size-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No conversations yet.</p>
            </div>
          )
        ) : (
          <>
            {groups.today.length > 0 && (
              <section className="mb-1">
                {!isCollapsed && (
                  <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Today
                  </p>
                )}
                {groups.today.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    isCollapsed={isCollapsed}
                    onUpdate={refresh}
                  />
                ))}
              </section>
            )}
            {groups.yesterday.length > 0 && (
              <section className="mb-1">
                {!isCollapsed && (
                  <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Yesterday
                  </p>
                )}
                {groups.yesterday.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    isCollapsed={isCollapsed}
                    onUpdate={refresh}
                  />
                ))}
              </section>
            )}
            {groups.week.length > 0 && (
              <section className="mb-1">
                {!isCollapsed && (
                  <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Previous 7 Days
                  </p>
                )}
                {groups.week.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    isCollapsed={isCollapsed}
                    onUpdate={refresh}
                  />
                ))}
              </section>
            )}
            {groups.older.length > 0 && (
              <section className="mb-1">
                {!isCollapsed && (
                  <p className="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Older
                  </p>
                )}
                {groups.older.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    isCollapsed={isCollapsed}
                    onUpdate={refresh}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Exported sidebar ──────────────────────────────────────────────────────────

interface Props {
  conversations: AIConversation[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function ConversationSidebar({
  conversations,
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: Props) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/ai-assistant/")
    ? pathname.replace("/ai-assistant/", "")
    : null;

  const sidebarBase =
    "flex flex-col overflow-hidden border-r border-border bg-sidebar";

  return (
    <>
      {/* ── Desktop sidebar (animated width) ── */}
      <aside
        className={cn(sidebarBase, "hidden h-full shrink-0 lg:flex")}
        style={{
          width: isCollapsed ? 60 : 240,
          transition: "width 250ms ease-in-out",
        }}
      >
        <SidebarContent
          conversations={conversations}
          activeId={activeId}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* ── Mobile drawer (slide-in from left) ── */}
      <aside
        className={cn(
          sidebarBase,
          "fixed left-0 top-0 z-50 h-full w-72 lg:hidden",
          "transition-transform duration-250 ease-in-out",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <SidebarContent
          conversations={conversations}
          activeId={activeId}
          isCollapsed={false}
          onToggleCollapse={onCloseMobile}
          onClose={onCloseMobile}
        />
      </aside>
    </>
  );
}
