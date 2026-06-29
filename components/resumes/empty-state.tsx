import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeEmptyStateProps {
  onUpload: () => void;
}

export function ResumeEmptyState({ onUpload }: ResumeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-24 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl border border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.12), oklch(0.65 0.22 310 / 0.08))",
        }}
      >
        <FileText className="size-7 text-primary" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        No resumes yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Upload your PDFs here to attach them to applications and use them with
        AI features.
      </p>
      <Button
        onClick={onUpload}
        className="mt-6 gap-2 border-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
        }}
      >
        Upload your first resume
      </Button>
    </div>
  );
}
