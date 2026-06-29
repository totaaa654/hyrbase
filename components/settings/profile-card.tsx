"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  user: SupabaseUser;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (name.trim().length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) return null; // optional
  const stripped = phone.replace(/[\s\-().+]/g, "");
  if (!/^\d{7,15}$/.test(stripped)) return "Enter a valid phone number.";
  return null;
}

export function ProfileCard({ user }: Props) {
  const meta = user.user_metadata ?? {};
  const [fullName, setFullName] = useState<string>(meta.full_name ?? "");
  const [phone, setPhone] = useState<string>(meta.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string>(meta.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (fullName || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Email verification badge: Supabase sets email_confirmed_at when verified
  const isVerified = !!user.email_confirmed_at;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 20 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        // Bucket may not exist — show a helpful message
        if (uploadError.message.includes("Bucket not found") ||
            uploadError.message.includes("bucket")) {
          toast.error('Storage bucket "avatars" not found. Create it in Supabase Dashboard → Storage.');
        } else {
          toast.error(`Upload failed: ${uploadError.message}`);
        }
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        toast.error("Could not save avatar: " + updateError.message);
        return;
      }

      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validate(): boolean {
    const nameErr = validateName(fullName);
    const phoneErr = validatePhone(phone);
    setErrors({ name: nameErr ?? undefined, phone: phoneErr ?? undefined });
    return !nameErr && !phoneErr;
  }

  function handleSave() {
    if (!validate()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      });
      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        toast.success("Profile updated successfully.");
        router.refresh();
      }
    });
  }

  const isDirty =
    fullName !== (meta.full_name ?? "") ||
    phone !== (meta.phone ?? "");

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-6 py-5">
        <h2 className="text-sm font-semibold">Personal Information</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Update your name, phone, and profile picture
        </p>
      </div>
      <Separator />

      <div className="space-y-6 px-6 py-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-border">
                <Image
                  src={avatarUrl}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 ring-2 ring-border">
                <span className="text-lg font-bold text-primary">{initials}</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
            {/* Camera overlay */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="size-3" />
            </button>
          </div>

          <div>
            <p className="text-sm font-medium">Profile Picture</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · Max 20 MB</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-1.5 text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading…" : "Upload new picture"}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <Separator />

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full Name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            placeholder="Your full name"
            className={errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email — read only */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email Address
          </Label>
          <div className="relative">
            <Input
              id="email"
              value={user.email ?? ""}
              readOnly
              className="cursor-default pr-24 opacity-70 focus-visible:ring-0"
            />
            {isVerified && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-500">Verified</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Email cannot be changed here.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone Number
            <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
            placeholder="+1 (555) 000-0000"
            className={errors.phone ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-end gap-3 px-6 py-4">
        {isDirty && !isPending && (
          <p className="mr-auto text-xs text-muted-foreground">You have unsaved changes</p>
        )}
        <Button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          size="sm"
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
