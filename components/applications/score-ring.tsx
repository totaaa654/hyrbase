"use client";

export function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Weak";
  return "Poor";
}

export function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 45) return "text-orange-400";
  return "text-red-400";
}

function scoreRingColor(score: number): string {
  if (score >= 90) return "oklch(0.65 0.18 160)";
  if (score >= 75) return "oklch(0.68 0.18 145)";
  if (score >= 60) return "oklch(0.75 0.18 85)";
  if (score >= 45) return "oklch(0.70 0.18 55)";
  return "oklch(0.60 0.22 25)";
}

export function ScoreRing({ score, size = 104 }: { score: number; size?: number }) {
  const r = Math.round(size * 0.385);
  const sw = Math.max(5, Math.round(size * 0.077));
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreRingColor(score)}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`font-bold leading-none ${scoreColor(score)}`}
          style={{ fontSize: Math.round(size * 0.21) }}
        >
          {score}%
        </span>
      </div>
    </div>
  );
}
