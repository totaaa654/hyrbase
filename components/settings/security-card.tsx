"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  userEmail: string;
}

type StrengthLevel = "too-short" | "weak" | "fair" | "strong" | "very-strong";

function measureStrength(password: string): StrengthLevel {
  if (password.length < 8) return "too-short";
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 2) return "weak";
  if (score === 3) return "fair";
  if (score === 4) return "strong";
  return "very-strong";
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  "too-short":  { label: "Too short",   color: "bg-red-400",    bars: 1 },
  "weak":       { label: "Weak",        color: "bg-red-400",    bars: 1 },
  "fair":       { label: "Fair",        color: "bg-amber-400",  bars: 2 },
  "strong":     { label: "Strong",      color: "bg-primary",    bars: 3 },
  "very-strong":{ label: "Very strong", color: "bg-emerald-400",bars: 4 },
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
        "text-red-400":    level === "too-short" || level === "weak",
        "text-amber-400":  level === "fair",
        "text-primary":    level === "strong",
        "text-emerald-400": level === "very-strong",
      })}>
        {label}
      </p>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
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

export function SecurityCard({ userEmail }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});
  const [isPending, startTransition] = useTransition();

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!current) errs.current = "Current password is required.";
    if (!next) errs.next = "New password is required.";
    else if (next.length < 8) errs.next = "Password must be at least 8 characters.";
    else if (measureStrength(next) === "weak" || measureStrength(next) === "too-short")
      errs.next = "Password is too weak. Add uppercase, numbers, or symbols.";
    else if (next === current) errs.next = "New password must differ from current password.";
    if (!confirm) errs.confirm = "Please confirm your new password.";
    else if (confirm !== next) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    startTransition(async () => {
      const supabase = createClient();

      // Step 1: verify current password by re-authenticating
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: current,
      });

      if (authError) {
        setErrors({ current: "Current password is incorrect." });
        return;
      }

      // Step 2: update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
      });

      if (updateError) {
        toast.error("Failed to update password: " + updateError.message);
        return;
      }

      toast.success("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
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
          <h2 className="text-sm font-semibold">Security</h2>
          <p className="text-xs text-muted-foreground">Update your password</p>
        </div>
      </div>
      <Separator />

      <div className="space-y-5 px-6 py-5">
        {/* Current password */}
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current Password</Label>
          <PasswordInput
            id="current-password"
            value={current}
            onChange={(v) => { setCurrent(v); setErrors((p) => ({ ...p, current: undefined })); }}
            placeholder="Enter your current password"
            autoComplete="current-password"
            error={errors.current}
          />
        </div>

        <Separator />

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <PasswordInput
            id="new-password"
            value={next}
            onChange={(v) => { setNext(v); setErrors((p) => ({ ...p, next: undefined })); }}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            error={errors.next}
          />
          <StrengthMeter password={next} />
          <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {[
              { rule: next.length >= 8, text: "At least 8 characters" },
              { rule: /[A-Z]/.test(next), text: "One uppercase letter" },
              { rule: /[0-9]/.test(next), text: "One number" },
              { rule: /[^a-zA-Z0-9]/.test(next), text: "One special character" },
            ].map(({ rule, text }) => (
              <li key={text} className={cn("flex items-center gap-1.5", rule && next ? "text-emerald-500" : "")}>
                <span className={cn("inline-block size-1 rounded-full", rule && next ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((p) => ({ ...p, confirm: undefined })); }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            error={errors.confirm}
          />
          {confirm && confirm === next && !errors.confirm && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-500">
              <span className="inline-block size-1 rounded-full bg-emerald-500" />
              Passwords match
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Use a strong, unique password you don&apos;t use elsewhere.
        </p>
        <Button
          onClick={handleSave}
          disabled={isPending || (!current && !next && !confirm)}
          size="sm"
          className="gap-2 shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              <Lock className="size-3.5" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
