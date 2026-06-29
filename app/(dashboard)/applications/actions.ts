"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getResumeById } from "@/app/(dashboard)/resumes/actions";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationDetail,
} from "@/types/application";

export async function getApplications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getApplication(
  id: string
): Promise<ApplicationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [appResult, historyResult] = await Promise.all([
    supabase
      .from("job_applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", id)
      .order("changed_at", { ascending: true }),
  ]);

  if (appResult.error || !appResult.data) return null;

  const application = appResult.data;
  const resume = application.resume_id
    ? await getResumeById(application.resume_id)
    : null;

  return {
    ...application,
    status_history: historyResult.data ?? [],
    resume,
  };
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<{ error?: string; id?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("job_applications")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) return { error: error.message };

    await supabase.from("application_status_history").insert({
      application_id: data.id,
      status: data.status,
      notes: "Application created",
    });

    revalidatePath("/applications");
    return { id: data.id };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { previousStatus, ...updateData } = input;

    const { data, error } = await supabase
      .from("job_applications")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return { error: error.message };

    if (updateData.status && updateData.status !== previousStatus) {
      await supabase.from("application_status_history").insert({
        application_id: id,
        status: data.status,
      });
    }

    revalidatePath("/applications");
    revalidatePath(`/applications/${id}`);
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteApplication(
  id: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/applications");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
