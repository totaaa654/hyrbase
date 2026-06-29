"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeCard } from "./resume-card";
import { ResumeUpload } from "./resume-upload";
import { ResumeEmptyState } from "./empty-state";
import type { Resume } from "@/types/resume";
import type { ResumeATSScore } from "@/types/analysis";

interface ResumesClientProps {
  resumes: Resume[];
  atsScores: Record<string, ResumeATSScore>;
}

export function ResumesClient({ resumes, atsScores }: ResumesClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Manage your PDF resumes and attach them to applications
          </p>
        </div>
        {resumes.length > 0 && (
          <Button
            onClick={() => setUploadOpen(true)}
            className="gap-2 border-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
            }}
          >
            <Upload className="size-4" />
            Upload Resume
          </Button>
        )}
      </div>

      {/* List */}
      {resumes.length === 0 ? (
        <ResumeEmptyState onUpload={() => setUploadOpen(true)} />
      ) : (
        <div className="flex flex-col gap-4">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              initialATSScore={atsScores[resume.id] ?? null}
            />
          ))}
        </div>
      )}

      <ResumeUpload open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
