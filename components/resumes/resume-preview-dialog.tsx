"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { getSignedUrl } from "@/app/(dashboard)/resumes/actions";

interface ResumePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  storagePath: string;
}

export function ResumePreviewDialog({
  open,
  onOpenChange,
  displayName,
  storagePath,
}: ResumePreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUrl() {
    if (!storagePath) {
      setError("Invalid resume path.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getSignedUrl(storagePath);

      if (result.error) {
        setError(result.error);
        setUrl(null);
      } else {
        setUrl(result.url ?? null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load resume.");
      setUrl(null);
    } finally {
      setLoading(false);
    }
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
            {displayName}
          </DialogTitle>

          {url && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </Button>
          )}
        </DialogHeader>

        <div className="flex flex-1 items-center justify-center bg-muted/30">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading resume...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-red-500">{error}</p>

              <Button onClick={loadUrl}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && url && (
            <iframe
              src={url}
              title={displayName}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}