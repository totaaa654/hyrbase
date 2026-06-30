import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifiedPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-5">
        {/* Icon */}
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10"
          style={{ animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <CheckCircle2 className="size-8 text-emerald-500" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Email Verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your email address has been confirmed. You&apos;re all set — sign in
            to start using HyrBase.
          </p>
        </div>

        {/* CTA */}
        <Button asChild className="w-full">
          <Link href="/login">Continue to Login</Link>
        </Button>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
