"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateResumeInput, Resume } from "@/types/resume";

export async function getResumes(): Promise<Resume[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as Resume[];
}

export async function getResumeById(
  id: string
): Promise<Pick<Resume, "id" | "display_name" | "file_url"> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("resumes")
    .select("id, display_name, file_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data ?? null;
}

export async function saveResumeMetadata(
  input: CreateResumeInput
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // If this is the first resume, make it the default
    const { count } = await supabase
      .from("resumes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("resumes")
      .insert({ ...input, user_id: user.id, is_default: count === 0 })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/resumes");
    return { id: data.id };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function renameResume(
  id: string,
  displayName: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("resumes")
      .update({ display_name: displayName.trim() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/resumes");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function setDefaultResume(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    await supabase
      .from("resumes")
      .update({ is_default: false })
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("resumes")
      .update({ is_default: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/resumes");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteResume(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: resume } = await supabase
      .from("resumes")
      .select("file_url, is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!resume) return { error: "Resume not found" };

    await supabase.storage.from("resumes").remove([resume.file_url]);

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    // If deleted resume was default, promote the most recent remaining one
    if (resume.is_default) {
      const { data: next } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (next) {
        await supabase
          .from("resumes")
          .update({ is_default: true })
          .eq("id", next.id);
      }
    }

    revalidatePath("/resumes");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function getSignedUrl(
  storagePath: string,
  forDownload = false
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Verify the path belongs to this user before issuing a signed URL.
    // The storage RLS also enforces this, but explicit server-side validation
    // prevents unnecessary round-trips and gives a clearer error.
    if (!storagePath.startsWith(`${user.id}/`)) {
      return { error: "Access denied" };
    }

    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(storagePath, 3600, forDownload ? { download: true } : undefined);

    if (error) return { error: error.message };
    return { url: data.signedUrl };
  } catch {
    return { error: "Could not generate URL." };
  }
}
