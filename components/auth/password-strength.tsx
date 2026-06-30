"use client";

import { cn } from "@/lib/utils";
import { measureStrength, STRENGTH_CONFIG, PASSWORD_RULES } from "@/lib/password";

// ── Strength meter bar ────────────────────────────────────────────────────────

export function StrengthMeter({ password }: { password: string }) {
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
      <p
        className={cn("text-[10px] font-medium", {
          "text-red-400":     level === "too-short" || level === "weak",
          "text-amber-400":   level === "fair",
          "text-primary":     level === "strong",
          "text-emerald-400": level === "very-strong",
        })}
      >
        {label}
      </p>
    </div>
  );
}

// ── Requirements checklist ────────────────────────────────────────────────────

interface PasswordChecklistProps {
  password: string;
  /** When provided, adds a "Passwords match" row at the bottom. */
  confirm?: string;
}

export function PasswordChecklist({ password, confirm }: PasswordChecklistProps) {
  if (!password && confirm === undefined) return null;

  const showRules = password.length > 0;
  const showMatch = confirm !== undefined && confirm.length > 0;
  const passwordsMatch = confirm === password;

  if (!showRules && !showMatch) return null;

  return (
    <ul className="mt-2 space-y-1 text-[11px]">
      {showRules &&
        PASSWORD_RULES.map(({ key, test, label }) => {
          const met = test(password);
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1.5 transition-colors duration-200",
                met ? "text-emerald-500" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  met
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted-foreground/40 bg-transparent"
                )}
              >
                {met && (
                  <svg viewBox="0 0 10 8" fill="none" className="size-2">
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {label}
            </li>
          );
        })}

      {showMatch && (
        <li
          className={cn(
            "flex items-center gap-1.5 transition-colors duration-200",
            passwordsMatch ? "text-emerald-500" : "text-destructive"
          )}
        >
          <span
            className={cn(
              "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
              passwordsMatch
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-destructive/60 bg-transparent"
            )}
          >
            {passwordsMatch ? (
              <svg viewBox="0 0 10 8" fill="none" className="size-2">
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 8 8" fill="none" className="size-2">
                <path
                  d="M1 1l6 6M7 1L1 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
          {passwordsMatch ? "Passwords match" : "Passwords do not match"}
        </li>
      )}
    </ul>
  );
}
