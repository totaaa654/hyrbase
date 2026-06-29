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
  Download,
  FileCheck,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ExpandableCard } from "@/components/applications/expandable-card";
import { scoreColor, scoreLabel } from "@/components/applications/score-ring";
import {
  runResumeAnalysis,
  runGenerateCoverLetter,
} from "@/app/(dashboard)/applications/[id]/analysis/actions";
import { attachCoverLetterFile } from "@/app/(dashboard)/applications/cover-letter-actions";
import { createClient } from "@/lib/supabase/client";
import type { ResumeAnalysisRecord } from "@/types/analysis";

interface Props {
  applicationId: string;
  hasResume: boolean;
  hasJobDescription: boolean;
  initialAnalysis: ResumeAnalysisRecord | null;
}

// ── Primitives ────────────────────────────────────────────────────────────────

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
        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
          <Icon className={`mt-0.5 size-3.5 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
        {title}
      </p>
      {children}
    </div>
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
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function buildPdfBlob(content: string): Promise<Blob> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 60;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const lineHeight = fontSize * 1.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);

    const paragraphs = content.split(/\n\n+/);
    let y = margin + 10;

    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para.replace(/\n/g, " "), maxWidth);
      for (const line of lines as string[]) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      y += lineHeight * 0.5;
    }

    return doc.output("blob");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEdit() {
    setDraft(text);
    setEditing(true);
  }

  function handleSaveDraft() {
    setText(draft);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
    setDraft(text);
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const blob = await buildPdfBlob(text);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cover_letter.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function handleUseCoverLetter() {
    setSaving(true);
    try {
      const blob = await buildPdfBlob(text);
      const file = new File([blob], "ai_cover_letter.pdf", { type: "application/pdf" });

      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const storagePath = `${user.id}/${crypto.randomUUID()}-ai_cover_letter.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("cover_letters")
        .upload(storagePath, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const result = await attachCoverLetterFile(applicationId, storagePath, "ai_cover_letter.pdf", file.size);
      if (result.error) throw new Error(result.error);

      toast.success("Cover letter attached to this application");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save cover letter");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy} disabled={editing}>
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>

        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={onRegenerate} disabled={editing || regenerating}>
          {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
          Regenerate
        </Button>

        {!editing ? (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleEdit} disabled={regenerating || saving || downloading}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-emerald-400 hover:text-emerald-400" onClick={handleSaveDraft}>
              <Check className="size-3.5" />
              Save
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleDownloadPdf} disabled={editing || downloading || saving}>
          {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download PDF
        </Button>

        <Button
          size="sm"
          className="h-7 gap-1.5 border-0 text-xs"
          style={{ background: "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))" }}
          onClick={handleUseCoverLetter}
          disabled={editing || saving || downloading}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <FileCheck className="size-3.5" />}
          {saving ? "Saving…" : "Use this Cover Letter"}
        </Button>
      </div>

      <Separator />

      {editing ? (
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[300px] resize-y text-sm leading-relaxed" />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="h-6 w-24 rounded bg-muted" />
      </div>
      <div className="space-y-2.5">
        <div className="h-8 w-52 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}

function CoverLetterSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-4 h-3 w-40 rounded bg-muted" />
      <div className="space-y-2">
        {[100, 90, 95, 85, 92, 80].map((w, i) => (
          <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Analysis Results ──────────────────────────────────────────────────────────

function AnalysisResults({ analysis }: { analysis: ResumeAnalysisRecord }) {
  return (
    <ExpandableCard
      title="AI Resume Analysis"
      expandLabel="View Full Analysis"
      preview={
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
            <div>
              <span className={`text-lg font-bold ${scoreColor(analysis.resume_match)}`}>
                {analysis.resume_match}%
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">Resume Match</span>
            </div>
            <div>
              <span className={`text-lg font-bold ${scoreColor(analysis.ats_score)}`}>
                {analysis.ats_score}%
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">ATS Score</span>
            </div>
            <span className={`text-xs font-medium ${scoreColor(analysis.resume_match)}`}>
              {scoreLabel(analysis.resume_match)}
            </span>
          </div>
          {analysis.summary && (
            <p className="line-clamp-1 text-sm text-muted-foreground">{analysis.summary}</p>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {analysis.summary && (
          <SubSection title="Summary">
            <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
          </SubSection>
        )}

        {analysis.matching_skills.length > 0 && (
          <SubSection title="Matching Skills">
            <SkillBadges skills={analysis.matching_skills} variant="match" />
          </SubSection>
        )}

        {analysis.missing_skills.length > 0 && (
          <SubSection title="Missing Skills">
            <SkillBadges skills={analysis.missing_skills} variant="missing" />
          </SubSection>
        )}

        {analysis.strengths.length > 0 && (
          <SubSection title="Strengths">
            <BulletList items={analysis.strengths} icon={CheckCircle2} iconClass="text-emerald-400" />
          </SubSection>
        )}

        {analysis.weaknesses.length > 0 && (
          <SubSection title="Weaknesses">
            <BulletList items={analysis.weaknesses} icon={XCircle} iconClass="text-red-400" />
          </SubSection>
        )}

        {analysis.suggestions.length > 0 && (
          <SubSection title="AI Suggestions">
            <ul className="space-y-2">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </SubSection>
        )}
      </div>
    </ExpandableCard>
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
  const [analysis, setAnalysis] = useState<ResumeAnalysisRecord | null>(initialAnalysis);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [coverLetterStatus, setCoverLetterStatus] = useState<CoverLetterStatus>(
    initialAnalysis?.generated_cover_letter ? "done" : "idle"
  );
  const [coverLetterText, setCoverLetterText] = useState<string | null>(
    initialAnalysis?.generated_cover_letter ?? null
  );
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);

  const canAnalyze = hasResume && hasJobDescription;
  const isAnalyzing = analysisStatus === "analyzing";
  const showResults = analysisStatus === "done" && analysis !== null;
  const isGeneratingCoverLetter = coverLetterStatus === "generating";

  async function handleAnalyze() {
    setAnalysisStatus("analyzing");
    setAnalysisError(null);
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
    background: "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.15), oklch(0.65 0.22 310 / 0.1))",
            }}
          >
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Resume Analysis</h2>
            <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              Last run{" "}
              {new Date(analysis.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
          {showResults && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleAnalyze} disabled={isAnalyzing}>
              <RotateCcw className="size-3.5" />
              Re-analyze
            </Button>
          )}
          {!showResults && (
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="gap-2 border-0"
              style={canAnalyze ? gradientStyle : undefined}
            >
              {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isAnalyzing ? "Analyzing…" : "Analyze Resume"}
            </Button>
          )}
        </div>
      </div>

      {/* Idle */}
      {analysisStatus === "idle" && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
          {!hasResume && (
            <p className="text-sm text-muted-foreground">
              Attach a resume to this application to enable AI analysis.
            </p>
          )}
          {hasResume && !hasJobDescription && (
            <p className="text-sm text-muted-foreground">
              Add a job description to enable AI analysis.
            </p>
          )}
          {canAnalyze && (
            <>
              <Sparkles className="mx-auto mb-3 size-7 text-primary/40" />
              <p className="mb-1 text-sm font-medium text-foreground">Ready to analyze</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Resume Match, ATS score, skill gaps, and actionable suggestions.
              </p>
              <Button onClick={handleAnalyze} className="gap-2 border-0" style={gradientStyle}>
                <Sparkles className="size-4" />
                Analyze Resume
              </Button>
            </>
          )}
        </div>
      )}

      {/* Analyzing */}
      {analysisStatus === "analyzing" && <LoadingSkeleton />}

      {/* Error */}
      {analysisStatus === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="mb-1 text-sm font-medium text-red-400">Analysis failed</p>
          <p className="mb-4 text-xs text-muted-foreground">{analysisError}</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleAnalyze}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <>
          <AnalysisResults analysis={analysis} />

          {/* Cover Letter prompt */}
          {coverLetterStatus === "idle" && (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Generate Cover Letter</p>
                  <p className="text-xs text-muted-foreground">
                    Tailored to this role using your resume
                  </p>
                </div>
              </div>
              <Button size="sm" className="gap-2 border-0 shrink-0" style={gradientStyle} onClick={handleGenerateCoverLetter}>
                <Sparkles className="size-3.5" />
                Generate
              </Button>
            </div>
          )}

          {coverLetterStatus === "generating" && <CoverLetterSkeleton />}

          {coverLetterStatus === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-center">
              <p className="mb-1 text-sm font-medium text-red-400">Cover letter generation failed</p>
              <p className="mb-3 text-xs text-muted-foreground">{coverLetterError}</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateCoverLetter}>
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {coverLetterStatus === "done" && coverLetterText && (
            <ExpandableCard
              title="Generated Cover Letter"
              expandLabel="View Cover Letter"
              preview={
                <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {coverLetterText}
                </p>
              }
            >
              <CoverLetterCard
                applicationId={applicationId}
                initialText={coverLetterText}
                onRegenerate={handleGenerateCoverLetter}
                regenerating={isGeneratingCoverLetter}
              />
            </ExpandableCard>
          )}
        </>
      )}
    </div>
  );
}
