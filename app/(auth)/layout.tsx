import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      {/* ── Animated orbs background ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-[20%] -top-[30%] size-[600px] rounded-full blur-[120px]"
          style={{
            background: "var(--orb-1)",
            animation: "orb-float-1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[15%] size-[500px] rounded-full blur-[100px]"
          style={{
            background: "var(--orb-2)",
            animation: "orb-float-2 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[30%] top-[50%] size-[350px] rounded-full blur-[90px]"
          style={{
            background: "var(--orb-3)",
            animation: "orb-float-3 12s ease-in-out infinite",
          }}
        />
      </div>

      {/* Dot-grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.55 0.01 285 / 0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top bar */}
      <header className="flex h-14 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/hyrbase_logo.png"
            alt="HyrBase"
            width={28}
            height={28}
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
        <ThemeToggle />
      </header>

      {/* Centered form */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
