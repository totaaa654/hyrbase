export type StrengthLevel = "too-short" | "weak" | "fair" | "strong" | "very-strong";

export function measureStrength(password: string): StrengthLevel {
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

export const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; bars: number }
> = {
  "too-short":   { label: "Too short",    color: "bg-red-400",     bars: 1 },
  "weak":        { label: "Weak",         color: "bg-red-400",     bars: 1 },
  "fair":        { label: "Fair",         color: "bg-amber-400",   bars: 2 },
  "strong":      { label: "Strong",       color: "bg-primary",     bars: 3 },
  "very-strong": { label: "Very strong",  color: "bg-emerald-400", bars: 4 },
};

export const PASSWORD_RULES = [
  { key: "length",    test: (p: string) => p.length >= 8,           label: "At least 8 characters" },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p),         label: "One uppercase letter" },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p),         label: "One lowercase letter" },
  { key: "number",    test: (p: string) => /[0-9]/.test(p),         label: "One number" },
  { key: "special",  test: (p: string) => /[^a-zA-Z0-9]/.test(p),  label: "One special character" },
] as const;

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}
