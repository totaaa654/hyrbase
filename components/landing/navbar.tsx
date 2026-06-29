"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/hyrbase_logo.png"
            alt="HyrBase"
            width={32}
            height={32}
            className="rounded-lg overflow-hidden"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight">
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

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="border-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
            }}
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
