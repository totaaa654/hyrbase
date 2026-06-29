"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { renameResume } from "@/app/(dashboard)/resumes/actions";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
  currentName: string;
}

export function RenameDialog({
  open,
  onOpenChange,
  resumeId,
  currentName,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) {
      onOpenChange(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await renameResume(resumeId, name.trim());
    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename resume</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Frontend Resume"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
