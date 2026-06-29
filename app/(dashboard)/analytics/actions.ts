"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AnalyticsPayload, CalendarEvent, CreateEventInput } from "@/types/analytics";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Analytics data ────────────────────────────────────────────────────────────

export async function getAnalyticsPayload(): Promise<AnalyticsPayload> {
  const { supabase, user } = await requireUser();

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      "id, company_name, position, status, date_applied, resume_id, job_description, salary_amount, salary_currency, salary_rate, employment_type, work_setup, updated_at"
    )
    .eq("user_id", user.id)
    .order("date_applied", { ascending: true });

  const apps = applications ?? [];
  const appIds = apps.map((a) => a.id);

  const [analysesRes, resumesRes, goalRes] = await Promise.all([
    appIds.length > 0
      ? supabase
          .from("resume_analyses")
          .select("application_id, resume_id, ats_score, resume_match")
          .in("application_id", appIds)
      : Promise.resolve({ data: [] as { application_id: string; resume_id: string | null; ats_score: number; resume_match: number }[] }),
    supabase
      .from("resumes")
      .select("id, display_name")
      .eq("user_id", user.id),
    supabase
      .from("user_goals")
      .select("weekly_applications_goal")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    applications: apps,
    analyses: analysesRes.data ?? [],
    resumes: resumesRes.data ?? [],
    weeklyGoal: goalRes.data?.weekly_applications_goal ?? 5,
  };
}

export async function setWeeklyGoal(goal: number): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("user_goals").upsert(
    { user_id: user.id, weekly_applications_goal: goal, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  revalidatePath("/analytics");
}

// ── Calendar events ───────────────────────────────────────────────────────────

export async function getCalendarEvents(
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const { supabase, user } = await requireUser();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data } = await supabase
    .from("calendar_events")
    .select(
      `id, application_id, title, description, event_type, start_time, end_time, all_day, priority, completed, color, created_at, updated_at,
       job_applications(company_name, position, status)`
    )
    .eq("user_id", user.id)
    .gte("start_time", start)
    .lte("start_time", end)
    .order("start_time", { ascending: true });

  return (data ?? []).map((row: any) => ({
    ...row,
    application: row.job_applications ?? null,
    job_applications: undefined,
  }));
}

export async function getUpcomingEvents(limit = 5): Promise<CalendarEvent[]> {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("calendar_events")
    .select(
      `id, application_id, title, description, event_type, start_time, end_time, all_day, priority, completed, color, created_at, updated_at,
       job_applications(company_name, position, status)`
    )
    .eq("user_id", user.id)
    .eq("completed", false)
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row: any) => ({
    ...row,
    application: row.job_applications ?? null,
    job_applications: undefined,
  }));
}

export async function createCalendarEvent(
  input: CreateEventInput
): Promise<{ id: string } | { error: string }> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...input, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/analytics");
  return { id: data.id };
}

export async function updateCalendarEvent(
  id: string,
  input: Partial<CreateEventInput>
): Promise<void | { error: string }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("calendar_events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/analytics");
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/analytics");
}

export async function toggleEventComplete(
  id: string,
  completed: boolean
): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from("calendar_events")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
}
