import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, BarChart3, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const FEATURES = [
  { icon: BriefcaseBusiness, text: "Track every application in one place" },
  { icon: BarChart3,         text: "Visualize your job search progress" },
  { icon: Sparkles,          text: "AI resume analysis & cover letters" },
] as const;

function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <Image
        src="/hyrbase_logo.png"
        alt="HyrBase"
        width={size}
        height={size}
        className="rounded-md overflow-hidden"
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
    </Link>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left branding panel (lg+) ──────────────────────────────────────── */}
      <aside className="relative hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-card p-10 sticky top-0 h-screen">
        {/* Animated orbs clipped inside the panel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-[20%] -top-[30%] size-[600px] rounded-full blur-[120px]"
            style={{ background: "var(--orb-1)", animation: "orb-float-1 18s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-[20%] -right-[15%] size-[500px] rounded-full blur-[100px]"
            style={{ background: "var(--orb-2)", animation: "orb-float-2 15s ease-in-out infinite" }}
          />
          <div
            className="absolute right-[30%] top-[50%] size-[350px] rounded-full blur-[90px]"
            style={{ background: "var(--orb-3)", animation: "orb-float-3 12s ease-in-out infinite" }}
          />
        </div>
        {/* Dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.55 0.01 285 / 0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top: logo */}
        <Logo size={30} />

        {/* Middle: tagline + feature list */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight leading-snug">
              Your AI-powered job search command&nbsp;center
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Organize your search, track every application, and let AI do the
              heavy lifting on resumes and cover letters.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: tagline */}
        <p className="text-xs text-muted-foreground">
          &ldquo;Land your dream job faster with intelligent tracking.&rdquo;
        </p>
      </aside>

      {/* ── Right form panel ────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col">
        {/* Mobile-only background (orbs + dot grid) */}
        <div aria-hidden className="lg:hidden pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-[20%] -top-[30%] size-[600px] rounded-full blur-[120px]"
            style={{ background: "var(--orb-1)", animation: "orb-float-1 18s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-[20%] -right-[15%] size-[500px] rounded-full blur-[100px]"
            style={{ background: "var(--orb-2)", animation: "orb-float-2 15s ease-in-out infinite" }}
          />
        </div>
        <div
          aria-hidden
          className="lg:hidden pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.55 0.01 285 / 0.14) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top bar — mobile shows logo; desktop hides it (shown in left panel) */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
          <div className="lg:invisible">
            <Logo size={26} />
          </div>
          <ThemeToggle />
        </header>

        {/* Scrollable form area — py-8 gives breathing room on short screens */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
