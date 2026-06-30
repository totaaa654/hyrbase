"use client";

import { useState, useEffect, useTransition } from "react";
import { Mail, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  userEmail: string;
}

const COOLDOWN_SECONDS = 60;

export function SecurityCard({ userEmail }: Props) {
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function sendEmail() {
    setServerError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setServerError(error.message || "Failed to send email. Please try again.");
        return;
      }

      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Change Password</h2>
          <p className="text-xs text-muted-foreground">
            We&apos;ll send a secure link to your email to set a new password
          </p>
        </div>
      </div>

      <Separator />

      <div className="px-6 py-5 space-y-4">
        {sent ? (
          /* ── Sent state ── */
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="font-medium text-foreground">{userEmail}</span>.
                Click the link to set your new password.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or resend below.
            </p>
          </div>
        ) : (
          /* ── Default state ── */
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email verification required</p>
              <p className="text-xs text-muted-foreground">
                For your security, we&apos;ll send a verification link to{" "}
                <span className="font-medium text-foreground">{userEmail}</span>{" "}
                before allowing a password change.
              </p>
            </div>
          </div>
        )}

        {serverError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-xs text-muted-foreground">
          The link expires in 1 hour and can only be used once.
        </p>
        <Button
          onClick={sendEmail}
          disabled={isPending || cooldown > 0}
          size="sm"
          className="gap-2 shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Sending…
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : sent ? (
            <>
              <Mail className="size-3.5" />
              Resend Email
            </>
          ) : (
            <>
              <Mail className="size-3.5" />
              Send Verification Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
