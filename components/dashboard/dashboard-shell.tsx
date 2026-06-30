"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";

interface Props {
  user: User;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: Props) {
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (any navigation)
  useEffect(() => {
    setOpen(false);
  }, []);

  // Prevent body scroll while sidebar drawer is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Backdrop (mobile only) ───────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {/*
        Mobile: fixed drawer that slides in from the left.
        Desktop (lg+): always visible, part of normal flow.
      */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar user={user} onClose={() => setOpen(false)} />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/hyrbase_logo.png"
              alt="HyrBase"
              width={24}
              height={24}
              className="rounded-md overflow-hidden"
            />
            <span className="text-sm font-extrabold tracking-tight">
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
          </Link>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
