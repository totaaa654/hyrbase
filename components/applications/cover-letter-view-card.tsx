"use client";

import { useState } from "react";
import { FileText, Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CoverLetterPreviewDialog } from "./cover-letter-preview-dialog";
import { getCoverLetterSignedUrl } from "@/app/(dashboard)/applications/cover-letter-actions";

interface CoverLetterViewCardProps {
  fileName: string;
  fileSize: number | null;
  uploadedAt: string | null;
  storagePath: string;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CoverLetterViewCard({
  fileName,
  fileSize,
  uploadedAt,
  storagePath,
}: CoverLetterViewCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const result = await getCoverLetterSignedUrl(storagePath, true);
    if (result.url) window.open(result.url, "_blank");
    else toast.error("Could not generate download link");
    setDownloading(false);
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.15), oklch(0.65 0.22 310 / 0.1))",
          }}
        >
          <FileText className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {fileName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[
              formatFileSize(fileSize),
              uploadedAt ? `Uploaded ${formatDate(uploadedAt)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
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
        </div>
      </div>

      <CoverLetterPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileName={fileName}
        storagePath={storagePath}
      />
    </>
  );
}
