"use client";

import { Sparkles } from "lucide-react";
import { ScoreRing, scoreLabel, scoreColor } from "./score-ring";
import type { ResumeAnalysisRecord } from "@/types/analysis";

interface Props {
  analysis: ResumeAnalysisRecord | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AnalysisSidebarCards({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Analysis
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Add a resume + job description, then run AI Analysis to see scores here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* AI Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.15), oklch(0.65 0.22 310 / 0.1))",
            }}
          >
            <Sparkles className="size-3 text-primary" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Summary
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Resume Match</span>
            <span className={`text-sm font-bold ${scoreColor(analysis.resume_match)}`}>
              {analysis.resume_match}%{" "}
              <span className="text-xs font-medium opacity-70">
                {scoreLabel(analysis.resume_match)}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ATS Score</span>
            <span className={`text-sm font-bold ${scoreColor(analysis.ats_score)}`}>
              {analysis.ats_score}%{" "}
              <span className="text-xs font-medium opacity-70">
                {scoreLabel(analysis.ats_score)}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Analyzed</span>
            <span className="text-xs text-foreground">{formatDate(analysis.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Quick Scores */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Scores
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={analysis.resume_match} size={80} />
            <p className="text-center text-xs text-muted-foreground">Resume Match</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={analysis.ats_score} size={80} />
            <p className="text-center text-xs text-muted-foreground">ATS Score</p>
          </div>
        </div>
      </div>
    </>
  );
}
