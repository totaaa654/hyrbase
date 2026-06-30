"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isPasswordStrong } from "@/lib/password";
import { StrengthMeter, PasswordChecklist } from "@/components/auth/password-strength";

// ── Password input with show/hide toggle ──────────────────────────────────────

function PasswordField({
  id,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          className={cn("pr-9", error && "border-destructive focus-visible:ring-destructive/30")}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PageState = "loading" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "invalid") {
      setPageState("invalid");
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPageState(session ? "ready" : "invalid");
    });
  }, [searchParams]);

  const allRulesMet = isPasswordStrong(password);
  const passwordsMatch = confirm !== "" && confirm === password;
  const canSubmit = allRulesMet && passwordsMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setFieldError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setFieldError(error.message);
      return;
    }
    setPageState("done");
    setTimeout(() => router.push("/login"), 3000);
  }

  // ── States ──────────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Verifying reset link…
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">
            This reset link is invalid or has expired.
          </p>
          <p className="text-xs text-muted-foreground">
            Reset links expire after 1 hour and can only be used once.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Request a new link
          </Link>
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (pageState === "done") {
    return (
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8 text-center space-y-2">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="size-5 text-emerald-500" />
          </div>
          <h1 className="text-lg font-semibold">Password updated</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been changed. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="mb-7 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <PasswordField
              id="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
            <StrengthMeter password={password} />
            <PasswordChecklist password={password} />
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <PasswordField
              id="confirm-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setFieldError(null); }}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            <PasswordChecklist password={password} confirm={confirm} />
          </div>

          {fieldError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {fieldError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
