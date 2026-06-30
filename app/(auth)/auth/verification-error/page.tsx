"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COOLDOWN_SECONDS = 60;

export default function VerificationErrorPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleResend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError(null);
    setServerError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setSent(true);
    setCooldown(COOLDOWN_SECONDS);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-5">
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10"
            style={{ animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <Mail className="size-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Email sent!</h1>
            <p className="text-sm text-muted-foreground">
              A new verification link has been sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Check your inbox and click the link to confirm your account.
            </p>
          </div>

          {cooldown > 0 && (
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it? You can resend in{" "}
              <span className="tabular-nums font-medium">{cooldown}s</span>.
            </p>
          )}

          <Button
            variant="outline"
            className="w-full"
            disabled={cooldown > 0}
            onClick={() => { setSent(false); }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend again"}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to Login
          </Link>
        </p>

        <style>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.6); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-5">
        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/10"
            style={{ animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <AlertTriangle className="size-8 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Verification Link Expired</h1>
            <p className="text-sm text-muted-foreground">
              This link is no longer valid. Verification links expire after
              24 hours and can only be used once. Enter your email below to
              receive a fresh link.
            </p>
          </div>
        </div>

        {/* Resend form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="resend-email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="resend-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(null); setServerError(null); }}
              className={fieldError ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {fieldError && (
              <p className="text-xs text-destructive">{fieldError}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to Login
        </Link>
      </p>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
