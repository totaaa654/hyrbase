"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { saveResumeMetadata } from "@/app/(dashboard)/resumes/actions";

interface ResumeUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeUpload({ open, onOpenChange }: ResumeUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  function reset() {
    setFile(null);
    setDisplayName("");
    setUploadProgress(0);
    setUploading(false);
    setDragOver(false);
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onOpenChange(false);
  }

  function pickFile(f: File) {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setFile(f);
    setDisplayName(f.name.replace(/\.pdf$/i, ""));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const sanitized = file.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/_{2,}/g, "_") || "resume.pdf";
      const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitized}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const result = await saveResumeMetadata({
        file_name: file.name,
        display_name: displayName.trim() || file.name.replace(/\.pdf$/i, ""),
        file_url: storagePath,
        file_size: file.size,
      });

      if (result.error) throw new Error(result.error);

      setUploadProgress(100);
      toast.success("Resume uploaded successfully");
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Drop zone */}
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div
                className="flex size-12 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.12), oklch(0.65 0.22 310 / 0.08))",
                }}
              >
                <Upload className="size-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop your PDF here, or{" "}
                  <span className="text-primary">click to browse</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  PDF only · max 10 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={() => { setFile(null); setDisplayName(""); }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Display name */}
          {file && (
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Frontend Resume"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Used to identify this resume in the app
              </p>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Uploading…
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="gap-2 border-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
              }}
            >
              {uploading && <Loader2 className="size-4 animate-spin" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
