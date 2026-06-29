"use client";

import Link from "next/link";
import { FileText, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types/resume";

interface ResumeSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  resumes: Resume[];
}

export function ResumeSelector({ value, onChange, resumes }: ResumeSelectorProps) {
  if (resumes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
        <FileText className="mx-auto mb-2 size-6 text-muted-foreground/50" />
        <p className="text-xs font-medium text-foreground">No resumes yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload resumes on the{" "}
          <Link
            href="/resumes"
            target="_blank"
            className="text-primary hover:underline"
          >
            Resumes page
          </Link>
          , then come back.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* None option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors",
          !value
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full border",
            !value ? "border-primary bg-primary" : "border-muted-foreground/40"
          )}
        >
          {!value && <Check className="size-2.5 text-primary-foreground" />}
        </span>
        <span className="font-medium">None selected</span>
      </button>

      {/* Resume options */}
      {resumes.map((resume) => (
        <button
          key={resume.id}
          type="button"
          onClick={() => onChange(resume.id)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors",
            value === resume.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full border",
              value === resume.id
                ? "border-primary bg-primary"
                : "border-muted-foreground/40"
            )}
          >
            {value === resume.id && (
              <Check className="size-2.5 text-primary-foreground" />
            )}
          </span>
          <FileText className="size-3.5 shrink-0 opacity-60" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {resume.display_name}
          </span>
          {resume.is_default && (
            <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
              Default
            </span>
          )}
        </button>
      ))}

      <Link
        href="/resumes"
        target="_blank"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary"
      >
        <Plus className="size-3.5" />
        Upload a new resume
      </Link>
    </div>
  );
}
