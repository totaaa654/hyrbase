"use client";

import { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumePreviewDialog } from "@/components/resumes/resume-preview-dialog";
import { getSignedUrl } from "@/app/(dashboard)/resumes/actions";

interface ResumeViewButtonsProps {
  storagePath: string;
  displayName: string;
}

export function ResumeViewButtons({ storagePath, displayName }: ResumeViewButtonsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const result = await getSignedUrl(storagePath, true);
    if (result.error) {
      toast.error("Could not generate download link");
    } else {
      window.open(result.url, "_blank");
    }
    setDownloading(false);
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-3.5" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
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
      </div>

      <ResumePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        displayName={displayName}
        storagePath={storagePath}
      />
    </>
  );
}
