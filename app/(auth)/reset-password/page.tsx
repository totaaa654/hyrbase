"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Password strength ─────────────────────────────────────────────────────────

type StrengthLevel = "too-short" | "weak" | "fair" | "strong" | "very-strong";

function measureStrength(p: string): StrengthLevel {
  if (p.length < 8) return "too-short";
  let s = 0;
  if (/[a-z]/.test(p)) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  if (p.length >= 12) s++;
  if (s <= 2) return "weak";
  if (s === 3) return "fair";
  if (s === 4) return "strong";
  return "very-strong";
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  "too-short":   { label: "Too short",    color: "bg-red-400",     bars: 1 },
  "weak":        { label: "Weak",         color: "bg-red-400",     bars: 1 },
  "fair":        { label: "Fair",         color: "bg-amber-400",   bars: 2 },
  "strong":      { label: "Strong",       color: "bg-primary",     bars: 3 },
  "very-strong": { label: "Very strong",  color: "bg-emerald-400", bars: 4 },
};

function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const level = measureStrength(password);
  const { label, color, bars } = STRENGTH_CONFIG[level];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < bars ? color : "bg-muted/60"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[10px] font-medium", {
        "text-red-400":     level === "too-short" || level === "weak",
        "text-amber-400":   level === "fair",
        "text-primary":     level === "strong",
        "text-emerald-400": level === "very-strong",
      })}>
        {label}
      </p>
    </div>
  );
}

function PasswordInput({
  id, value, onChange, placeholder, autoComplete, error,
}: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn("pr-9", error && "border-destructive focus-visible:ring-destructive/30")}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
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
    <Suspense fallback={
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the callback route already failed, show invalid immediately
    if (searchParams.get("error") === "invalid") {
      setPageState("invalid");
      return;
    }

    // The /auth/callback route already exchanged the code and set session cookies.
    // Just verify there's an active session.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPageState(session ? "ready" : "invalid");
    });
  }, [searchParams]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!password) errs.password = "New password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    else if (measureStrength(password) === "weak" || measureStrength(password) === "too-short")
      errs.password = "Password is too weak. Add uppercase, numbers, or symbols.";
    if (!confirm) errs.confirm = "Please confirm your password.";
    else if (confirm !== password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErrors({ password: error.message });
      return;
    }
    setPageState("done");
    setTimeout(() => router.push("/login"), 3000);
  }

  // ── States ──

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
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-3">
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
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (pageState === "done") {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-2">
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
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              New Password
            </label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              error={errors.password}
            />
            <StrengthMeter password={password} />
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              {[
                { rule: password.length >= 8,       text: "At least 8 characters" },
                { rule: /[A-Z]/.test(password),     text: "One uppercase letter" },
                { rule: /[0-9]/.test(password),     text: "One number" },
                { rule: /[^a-zA-Z0-9]/.test(password), text: "One special character" },
              ].map(({ rule, text }) => (
                <li key={text} className={cn("flex items-center gap-1.5", rule && password ? "text-emerald-500" : "")}>
                  <span className={cn("inline-block size-1 rounded-full", rule && password ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm Password
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={(v) => { setConfirm(v); setErrors((p) => ({ ...p, confirm: undefined })); }}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              error={errors.confirm}
            />
            {confirm && confirm === password && !errors.confirm && (
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <span className="inline-block size-1 rounded-full bg-emerald-500" />
                Passwords match
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
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

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
