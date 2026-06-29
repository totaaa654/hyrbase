"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getCoverLetterSignedUrl(
  storagePath: string,
  forDownload = false
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    if (!storagePath.startsWith(`${user.id}/`)) {
      return { error: "Access denied" };
    }

    const { data, error } = await supabase.storage
      .from("cover_letters")
      .createSignedUrl(
        storagePath,
        3600,
        forDownload ? { download: true } : undefined
      );

    if (error) return { error: error.message };
    return { url: data.signedUrl };
  } catch {
    return { error: "Could not generate URL." };
  }
}

export async function deleteCoverLetterFromStorage(
  storagePath: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    if (!storagePath.startsWith(`${user.id}/`)) {
      return { error: "Access denied" };
    }

    await supabase.storage.from("cover_letters").remove([storagePath]);
    return {};
  } catch {
    return { error: "Something went wrong." };
  }
}

export async function attachCoverLetterFile(
  applicationId: string,
  fileUrl: string,
  fileName: string,
  fileSize: number
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Fetch the old file URL so we can clean it up after
    const { data: existing } = await supabase
      .from("job_applications")
      .select("cover_letter_file_url")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("job_applications")
      .update({
        cover_letter_file_url: fileUrl,
        cover_letter_file_name: fileName,
        cover_letter_file_size: fileSize,
        cover_letter_uploaded_at: new Date().toISOString(),
        cover_letter: null, // clear any legacy text field
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    // Clean up old file (best-effort, non-blocking)
    if (
      existing?.cover_letter_file_url &&
      existing.cover_letter_file_url !== fileUrl
    ) {
      await supabase.storage
        .from("cover_letters")
        .remove([existing.cover_letter_file_url]);
    }

    revalidatePath(`/applications/${applicationId}`);
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
