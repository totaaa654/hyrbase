"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 60;

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

// ── Password field with show/hide toggle ──────────────────────────────────────

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

// ── Check-your-email screen ───────────────────────────────────────────────────

function CheckEmailScreen({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleResend() {
    setResendError(null);
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) { setResendError(error.message); return; }
    setCooldown(RESEND_COOLDOWN);
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      <div className="rounded-2xl border border-border bg-card px-6 py-10 shadow-sm sm:px-8 text-center space-y-5">
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10"
          style={{ animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <Mail className="size-8 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
          <p className="text-sm text-muted-foreground">We sent a confirmation link to</p>
          <p className="text-sm font-semibold text-foreground break-all">{email}</p>
          <p className="text-sm text-muted-foreground">
            Click the link to activate your account.
          </p>
        </div>

        <Button asChild className="w-full">
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
            Open Gmail
          </a>
        </Button>

        {resendError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {resendError}
          </p>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending ? (
            <><Loader2 className="animate-spin" />Sending…</>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            "Resend Email"
          )}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
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

// ── Signup form ───────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) { setServerError(error.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSentEmail(data.email);
    }
  }

  if (sentEmail) return <CheckEmailScreen email={sentEmail} />;

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="mb-7 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your job search for free
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Alex Johnson"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              className={cn(errors.fullName && "border-destructive focus-visible:ring-destructive/30")}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={cn(errors.email && "border-destructive focus-visible:ring-destructive/30")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordField
              id="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordField
              id="confirmPassword"
              placeholder="Re-enter password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="animate-spin" />Creating account…</>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
