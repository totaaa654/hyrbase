"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Sparkles,
  BarChart2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/ai-tools", label: "AI Tools", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
] as const;

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "U";
  const initials = displayName[0].toUpperCase();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Image
          src="/hyrbase_logo.png"
          alt="HyrBase"
          width={28}
          height={28}
          className="rounded-md overflow-hidden shrink-0"
        />
        <span className="text-base font-extrabold tracking-tight">
          Hyr
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.627 0.265 293), oklch(0.72 0.20 310))",
            }}
          >
            Base
          </span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme toggle */}
      <div className="border-t border-border px-3 py-2">
        <ThemeToggle />
      </div>

      {/* Settings + user footer */}
      <div className="border-t border-border p-2 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>

        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <span className="text-xs font-semibold text-primary">
              {initials}
            </span>
          </div>
          <p className="flex-1 truncate text-xs font-medium text-foreground">
            {displayName}
          </p>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
