"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCoverLetterSignedUrl } from "@/app/(dashboard)/applications/cover-letter-actions";

interface CoverLetterPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  storagePath: string;
}

export function CoverLetterPreviewDialog({
  open,
  onOpenChange,
  fileName,
  storagePath,
}: CoverLetterPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUrl() {
    setLoading(true);
    setError(null);
    const result = await getCoverLetterSignedUrl(storagePath);
    if (result.error) {
      setError(result.error);
      setUrl(null);
    } else {
      setUrl(result.url ?? null);
    }
    setLoading(false);
  }

  async function handleDownload() {
    const result = await getCoverLetterSignedUrl(storagePath, true);
    if (result.url) window.open(result.url, "_blank");
  }

  useEffect(() => {
    if (open) {
      loadUrl();
    } else {
      setUrl(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
          <DialogTitle className="truncate text-sm font-semibold">
            {fileName}
          </DialogTitle>
          {url && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleDownload}>
                <Download className="size-4" />
                Download
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-1 items-center justify-center bg-muted/30">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-red-500">{error}</p>
              <Button onClick={loadUrl}>Retry</Button>
            </div>
          )}
          {!loading && !error && url && (
            <iframe
              src={url}
              title={fileName}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
