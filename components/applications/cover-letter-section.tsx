"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  MessageSquare,
  FileOutput,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CoverLetterPreviewDialog } from "./cover-letter-preview-dialog";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoverLetterData {
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
}

interface CoverLetterSectionProps {
  value: CoverLetterData;
  onChange: (value: CoverLetterData) => void;
  onPendingDelete: (path: string) => void;
  legacyText?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function sanitizeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9._-]/g, "")
      .replace(/_{2,}/g, "_") || "cover_letter.pdf"
  );
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────

function DropZone({ onFile, uploading }: { onFile: (f: File) => void; uploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(f: File) {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    onFile(f);
  }

  return (
    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) pick(f);
      }}
      className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {uploading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <div
          className="flex size-11 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.12), oklch(0.65 0.22 310 / 0.08))",
          }}
        >
          <Upload className="size-5 text-primary" />
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {uploading
            ? "Uploading…"
            : <>Drop your PDF here, or <span className="text-primary">click to browse</span></>}
        </p>
        {!uploading && (
          <p className="mt-0.5 text-xs text-muted-foreground">PDF only · max 10 MB</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}

// ── File Card ─────────────────────────────────────────────────────────────────

function FileCard({
  data,
  onReplace,
  onRemove,
  replacing,
  removing,
}: {
  data: CoverLetterData;
  onReplace: (f: File) => void;
  onRemove: () => void;
  replacing: boolean;
  removing: boolean;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!data.fileUrl) return;
    setDownloading(true);
    const { getCoverLetterSignedUrl } = await import(
      "@/app/(dashboard)/applications/cover-letter-actions"
    );
    const result = await getCoverLetterSignedUrl(data.fileUrl, true);
    if (result.url) window.open(result.url, "_blank");
    else toast.error("Could not generate download link");
    setDownloading(false);
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        {/* File info */}
        <div className="flex items-start gap-3">
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
            <p className="truncate text-sm font-semibold text-foreground">
              {data.fileName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[
                formatFileSize(data.fileSize),
                data.uploadedAt ? `Uploaded ${formatDate(data.uploadedAt)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setPreviewOpen(true)}
            disabled={!data.fileUrl}
          >
            <Eye className="size-3.5" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleDownload}
            disabled={!data.fileUrl || downloading}
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => replaceRef.current?.click()}
            disabled={replacing || removing}
          >
            {replacing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={removing || replacing}
          >
            {removing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Remove
          </Button>
        </div>
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.type !== "application/pdf") {
            toast.error("Only PDF files are accepted");
            return;
          }
          if (f.size > 10 * 1024 * 1024) {
            toast.error("File must be under 10 MB");
            return;
          }
          onReplace(f);
          e.target.value = "";
        }}
      />

      {data.fileUrl && (
        <CoverLetterPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileName={data.fileName ?? "Cover Letter"}
          storagePath={data.fileUrl}
        />
      )}
    </>
  );
}

// ── Legacy Text Display ───────────────────────────────────────────────────────

function LegacyTextSection({
  text,
  onConverted,
  onPendingDelete,
}: {
  text: string;
  onConverted: (data: CoverLetterData) => void;
  onPendingDelete: (path: string) => void;
}) {
  const [converting, setConverting] = useState(false);

  async function handleConvert() {
    setConverting(true);
    try {
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

      const paragraphs = text.split(/\n\n+/);
      let y = margin + 10;

      for (const para of paragraphs) {
        const lines = doc.splitTextToSize(para.replace(/\n/g, " "), maxWidth);
        for (const line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += lineHeight * 0.5;
      }

      const blob = doc.output("blob");
      const file = new File([blob], "cover_letter.pdf", { type: "application/pdf" });

      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const storagePath = `${user.id}/${crypto.randomUUID()}-cover_letter.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("cover_letters")
        .upload(storagePath, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      onConverted({
        fileUrl: storagePath,
        fileName: "cover_letter.pdf",
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      });
      toast.success("Converted and uploaded as PDF");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Legacy cover letter text
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleConvert}
          disabled={converting}
        >
          {converting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileOutput className="size-3.5" />
          )}
          {converting ? "Converting…" : "Convert to PDF"}
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export function CoverLetterSection({
  value,
  onChange,
  onPendingDelete,
  legacyText,
}: CoverLetterSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("Not authenticated");
      return null;
    }

    const sanitized = sanitizeFilename(file.name);
    const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitized}`;

    const { error } = await supabase.storage
      .from("cover_letters")
      .upload(storagePath, file, { contentType: "application/pdf" });

    if (error) {
      toast.error(error.message);
      return null;
    }
    return storagePath;
  }

  async function handleNewFile(file: File) {
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (!path) return;

    onChange({
      fileUrl: path,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
    toast.success("Cover letter uploaded");
  }

  async function handleReplace(file: File) {
    setReplacing(true);
    const path = await uploadFile(file);
    setReplacing(false);
    if (!path) return;

    // Queue old file for deletion after form submit
    if (value.fileUrl) onPendingDelete(value.fileUrl);

    onChange({
      fileUrl: path,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
    toast.success("Cover letter replaced");
  }

  function handleRemove() {
    // Queue for deletion after form submit
    if (value.fileUrl) onPendingDelete(value.fileUrl);
    onChange({ fileUrl: null, fileName: null, fileSize: null, uploadedAt: null });
  }

  const hasFile = !!value.fileUrl;
  const hasLegacy = !hasFile && !!legacyText;

  return (
    <div className="space-y-4">
      {hasFile ? (
        <FileCard
          data={value}
          onReplace={handleReplace}
          onRemove={handleRemove}
          replacing={replacing}
          removing={false}
        />
      ) : (
        <DropZone onFile={handleNewFile} uploading={uploading} />
      )}

      {hasLegacy && (
        <LegacyTextSection
          text={legacyText!}
          onConverted={(converted) => onChange(converted)}
          onPendingDelete={onPendingDelete}
        />
      )}
    </div>
  );
}
