"use client";

import { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  MoreHorizontal,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResumePreviewDialog } from "./resume-preview-dialog";
import { RenameDialog } from "./rename-dialog";
import {
  setDefaultResume,
  deleteResume,
  getSignedUrl,
} from "@/app/(dashboard)/resumes/actions";
import { runResumeATSAnalysis } from "@/app/(dashboard)/resumes/ats-actions";
import type { Resume } from "@/types/resume";
import type { ResumeATSScore } from "@/types/analysis";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function atsColors(score: number) {
  if (score >= 90)
    return {
      text: "text-emerald-400",
      bar: "bg-emerald-400",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    };
  if (score >= 75)
    return {
      text: "text-blue-400",
      bar: "bg-blue-400",
      badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    };
  if (score >= 60)
    return {
      text: "text-amber-400",
      bar: "bg-amber-400",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  return {
    text: "text-red-400",
    bar: "bg-red-400",
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
  };
}

// ── ATS Score Panel ───────────────────────────────────────────────────────────

function ATSScorePanel({
  score,
  onAnalyze,
  analyzing,
}: {
  score: ResumeATSScore | null;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  const gradientBtn = {
    background:
      "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
  };

  if (!score) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center sm:w-[200px] sm:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          ATS Score
        </p>
        <p className="text-xs text-muted-foreground">Not analyzed yet</p>
        <Button
          size="sm"
          className="gap-1.5 border-0 text-xs"
          style={gradientBtn}
          onClick={onAnalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {analyzing ? "Analyzing…" : "Analyze Resume"}
        </Button>
      </div>
    );
  }

  const c = atsColors(score.ats_score);

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card px-5 py-5 sm:w-[200px] sm:shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        ATS Score
      </p>

      <div className="space-y-1.5">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums ${c.text}`}>
            {score.ats_score}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
            style={{ width: `${score.ats_score}%` }}
          />
        </div>

        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${c.badge}`}
        >
          {score.status}
        </span>
      </div>

      <div className="mt-auto space-y-2 border-t border-border pt-3">
        <p className="text-[10px] text-muted-foreground">
          Last analyzed: {formatDate(score.updated_at)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full gap-1.5 text-xs"
          onClick={onAnalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          {analyzing ? "Analyzing…" : "Refresh Analysis"}
        </Button>
      </div>
    </div>
  );
}

// ── Resume Card ───────────────────────────────────────────────────────────────

interface ResumeCardProps {
  resume: Resume;
  initialATSScore: ResumeATSScore | null;
}

export function ResumeCard({ resume, initialATSScore }: ResumeCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [atsScore, setAtsScore] = useState<ResumeATSScore | null>(
    initialATSScore
  );

  async function handleDownload() {
    setDownloading(true);
    const result = await getSignedUrl(resume.file_url, true);
    if (result.error) {
      toast.error("Could not generate download link");
    } else {
      window.open(result.url, "_blank");
    }
    setDownloading(false);
  }

  async function handleSetDefault() {
    setSettingDefault(true);
    const result = await setDefaultResume(resume.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${resume.display_name}" is now your default resume`);
    }
    setSettingDefault(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteResume(resume.id);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success("Resume deleted");
      setDeleteOpen(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const result = await runResumeATSAnalysis(resume.id);
    setAnalyzing(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.data) {
      setAtsScore(result.data);
      toast.success("ATS analysis complete");
    }
  }

  return (
    <>
      <div className="group rounded-xl border border-border bg-card transition-all hover:border-primary/25 hover:shadow-lg hover:shadow-black/10">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch">

          {/* ── Left: resume info + actions ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Icon + name row */}
            <div className="flex items-start gap-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.15), oklch(0.65 0.22 310 / 0.1))",
                }}
              >
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {resume.display_name}
                  </p>
                  {resume.is_default && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                      <Star className="size-2.5 fill-current" />
                      Default
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {resume.file_name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    formatFileSize(resume.file_size),
                    formatDate(resume.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-3.5" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Download
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!resume.is_default && (
                    <DropdownMenuItem
                      onClick={handleSetDefault}
                      disabled={settingDefault}
                      className="gap-2"
                    >
                      {settingDefault ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Star className="size-4" />
                      )}
                      Set as default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setRenameOpen(true)}
                    className="gap-2"
                  >
                    <Pencil className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Right: ATS score panel ── */}
          <ATSScorePanel
            score={atsScore}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ResumePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        displayName={resume.display_name}
        storagePath={resume.file_url}
      />

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        resumeId={resume.id}
        currentName={resume.display_name}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{resume.display_name}</strong> and remove it from
              Supabase Storage. Applications that reference this resume will
              lose the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
