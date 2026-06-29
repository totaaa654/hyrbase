"use client";

import { useState } from "react";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Pencil,
  Save,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  runResumeAnalysis,
  runGenerateCoverLetter,
  saveCoverLetterToApplication,
} from "@/app/(dashboard)/applications/[id]/analysis/actions";
import type { ResumeAnalysisRecord } from "@/types/analysis";

interface Props {
  applicationId: string;
  hasResume: boolean;
  hasJobDescription: boolean;
  initialAnalysis: ResumeAnalysisRecord | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Weak";
  return "Poor";
}

function scoreColor(score: number): string {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Primitives ────────────────────────────────────────────────────────────────

function AnalysisCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h4>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="104" height="104" className="-rotate-90">
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke={scoreRingColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function MetricCard({ title, score }: { title: string; score: number }) {
  return (
    <AnalysisCard className="flex flex-col items-center gap-3 text-center">
      <ScoreRing score={score} />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className={`text-xs font-medium ${scoreColor(score)}`}>
          {scoreLabel(score)}
        </p>
      </div>
    </AnalysisCard>
  );
}

function SkillBadges({
  skills,
  variant,
}: {
  skills: string[];
  variant: "match" | "missing";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
            variant === "match"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function BulletList({
  items,
  icon: Icon,
  iconClass,
}: {
  items: string[];
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-foreground/80"
        >
          <Icon className={`mt-0.5 size-3.5 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Cover Letter Card ─────────────────────────────────────────────────────────

function CoverLetterCard({
  applicationId,
  initialText,
  onRegenerate,
  regenerating,
}: {
  applicationId: string;
  initialText: string;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [text, setText] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEdit() {
    setDraft(text);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraft(text);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveCoverLetterToApplication(applicationId, draft);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setText(draft);
    setEditing(false);
    toast.success("Cover letter saved to application");
  }

  return (
    <AnalysisCard>
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionTitle>Generated Cover Letter</SectionTitle>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopy}
            disabled={editing}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={onRegenerate}
            disabled={editing || regenerating}
          >
            {regenerating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Regenerate
          </Button>

          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleEdit}
              disabled={regenerating}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 border-0 text-xs"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save to Application
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[300px] resize-y text-sm leading-relaxed"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {text}
        </p>
      )}
    </AnalysisCard>
  );
}

// ── Loading Skeletons ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mx-auto mb-3 size-[104px] rounded-full bg-muted" />
            <div className="mx-auto h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
      {[120, 80, 100, 80, 160].map((h, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function CoverLetterSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-4 h-3 w-32 rounded bg-muted" />
      <div className="space-y-2">
        {[100, 90, 95, 85, 92, 80].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded bg-muted"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Analysis Results (no cover letter) ───────────────────────────────────────

function AnalysisResults({ analysis }: { analysis: ResumeAnalysisRecord }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <MetricCard title="Resume Match" score={analysis.resume_match} />
        <MetricCard title="ATS Compatibility" score={analysis.ats_score} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AnalysisCard>
          <SectionTitle>Matching Skills</SectionTitle>
          <SkillBadges skills={analysis.matching_skills} variant="match" />
        </AnalysisCard>
        <AnalysisCard>
          <SectionTitle>Missing Skills</SectionTitle>
          <SkillBadges skills={analysis.missing_skills} variant="missing" />
        </AnalysisCard>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AnalysisCard>
          <SectionTitle>Strengths</SectionTitle>
          <BulletList
            items={analysis.strengths}
            icon={CheckCircle2}
            iconClass="text-emerald-400"
          />
        </AnalysisCard>
        <AnalysisCard>
          <SectionTitle>Weaknesses</SectionTitle>
          <BulletList
            items={analysis.weaknesses}
            icon={XCircle}
            iconClass="text-red-400"
          />
        </AnalysisCard>
      </div>

      {analysis.summary && (
        <AnalysisCard>
          <SectionTitle>Resume Summary</SectionTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {analysis.summary}
          </p>
        </AnalysisCard>
      )}

      {analysis.suggestions.length > 0 && (
        <AnalysisCard>
          <SectionTitle>AI Suggestions</SectionTitle>
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground/80"
              >
                <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </AnalysisCard>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function ResumeAnalysisPanel({
  applicationId,
  hasResume,
  hasJobDescription,
  initialAnalysis,
}: Props) {
  type AnalysisStatus = "idle" | "analyzing" | "done" | "error";
  type CoverLetterStatus = "idle" | "generating" | "done" | "error";

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(
    initialAnalysis ? "done" : "idle"
  );
  const [analysis, setAnalysis] = useState<ResumeAnalysisRecord | null>(
    initialAnalysis
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [coverLetterStatus, setCoverLetterStatus] =
    useState<CoverLetterStatus>(
      initialAnalysis?.generated_cover_letter ? "done" : "idle"
    );
  const [coverLetterText, setCoverLetterText] = useState<string | null>(
    initialAnalysis?.generated_cover_letter ?? null
  );
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);

  const canAnalyze = hasResume && hasJobDescription;
  const isAnalyzing = analysisStatus === "analyzing";
  const showResults = analysisStatus === "done" && analysis !== null;

  async function handleAnalyze() {
    setAnalysisStatus("analyzing");
    setAnalysisError(null);
    // Reset cover letter when re-analyzing
    setCoverLetterStatus("idle");
    setCoverLetterText(null);

    const result = await runResumeAnalysis(applicationId);

    if (result.error) {
      setAnalysisStatus("error");
      setAnalysisError(result.error);
      toast.error(result.error);
      return;
    }

    if (result.data) {
      setAnalysis(result.data);
      setAnalysisStatus("done");
      toast.success("Analysis complete");
    }
  }

  async function handleGenerateCoverLetter() {
    setCoverLetterStatus("generating");
    setCoverLetterError(null);

    const result = await runGenerateCoverLetter(applicationId);

    if (result.error) {
      setCoverLetterStatus("error");
      setCoverLetterError(result.error);
      toast.error(result.error);
      return;
    }

    setCoverLetterText(result.coverLetter ?? null);
    setCoverLetterStatus("done");
    toast.success("Cover letter generated");
  }

  const gradientStyle = {
    background:
      "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.15), oklch(0.65 0.22 310 / 0.1))",
            }}
          >
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI Resume Analysis
            </h2>
            <p className="text-xs text-muted-foreground">
              Powered by Google Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <p className="text-xs text-muted-foreground">
              Last run {formatDate(analysis.created_at)}
            </p>
          )}
          {showResults && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <RotateCcw className="size-3.5" />
              Re-analyze
            </Button>
          )}
          {!showResults && (
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analysisStatus === "analyzing"}
              className="gap-2 border-0"
              style={canAnalyze ? gradientStyle : undefined}
            >
              {analysisStatus === "analyzing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {analysisStatus === "analyzing" ? "Analyzing…" : "Analyze Resume"}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Idle */}
      {analysisStatus === "idle" && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          {!hasResume && (
            <p className="text-sm text-muted-foreground">
              Attach a resume to this application to enable AI analysis.
            </p>
          )}
          {hasResume && !hasJobDescription && (
            <p className="text-sm text-muted-foreground">
              Add a job description to this application to enable AI analysis.
            </p>
          )}
          {canAnalyze && (
            <>
              <Sparkles className="mx-auto mb-3 size-8 text-primary/40" />
              <p className="mb-1 text-sm font-medium text-foreground">
                Ready to analyze
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Get your Resume Match score, ATS compatibility, skill gaps, and
                actionable suggestions.
              </p>
              <Button
                onClick={handleAnalyze}
                className="gap-2 border-0"
                style={gradientStyle}
              >
                <Sparkles className="size-4" />
                Analyze Resume
              </Button>
            </>
          )}
        </div>
      )}

      {/* Analyzing skeleton */}
      {analysisStatus === "analyzing" && <LoadingSkeleton />}

      {/* Analysis error */}
      {analysisStatus === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="mb-1 text-sm font-medium text-red-400">
            Analysis failed
          </p>
          <p className="mb-4 text-xs text-muted-foreground">{analysisError}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleAnalyze}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <>
          <AnalysisResults analysis={analysis} />

          <Separator />

          {/* Cover Letter section */}
          {coverLetterStatus === "idle" && (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Generate Cover Letter
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tailored to this role and company using your resume
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="gap-2 border-0"
                style={gradientStyle}
                onClick={handleGenerateCoverLetter}
              >
                <Sparkles className="size-3.5" />
                Generate
              </Button>
            </div>
          )}

          {coverLetterStatus === "generating" && <CoverLetterSkeleton />}

          {coverLetterStatus === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-center">
              <p className="mb-1 text-sm font-medium text-red-400">
                Cover letter generation failed
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {coverLetterError}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleGenerateCoverLetter}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {coverLetterStatus === "done" && coverLetterText && (
            <CoverLetterCard
              applicationId={applicationId}
              initialText={coverLetterText}
              onRegenerate={handleGenerateCoverLetter}
              regenerating={false}
            />
          )}
        </>
      )}
    </div>
  );
}
