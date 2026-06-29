import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="text-sm font-semibold text-foreground">
          Hyr<span className="text-primary">Base</span>
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
