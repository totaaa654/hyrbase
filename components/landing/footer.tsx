import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
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

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} HyrBase. All rights reserved.
        </p>

        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
