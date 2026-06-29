"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/ai/parser";
import { AIService } from "@/lib/ai/service";
import type { ResumeAnalysisRecord } from "@/types/analysis";

// ── Shared helper ─────────────────────────────────────────────────────────────

async function fetchResumeText(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  userId: string
): Promise<{ resumeText: string; resumeId: string; application: Record<string, unknown> } | { error: string }> {
  const { data: application, error: appError } = await supabase
    .from("job_applications")
    .select("*, resumes(id, file_url)")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (appError || !application) return { error: "Application not found." };

  if (!application.job_description?.trim()) {
    return {
      error: "A job description is required. Add one on the edit page.",
    };
  }

  const resumeRecord = Array.isArray(application.resumes)
    ? application.resumes[0]
    : application.resumes;

  if (!resumeRecord?.file_url) {
    return {
      error: "No resume is attached to this application. Select one on the edit page.",
    };
  }

  const { data: fileData, error: dlError } = await supabase.storage
    .from("resumes")
    .download(resumeRecord.file_url);

  if (dlError || !fileData) {
    return { error: "Could not download resume file. Please try again." };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const resumeText = await extractTextFromPdf(buffer);

  return { resumeText, resumeId: resumeRecord.id, application };
}

// ── Public actions ────────────────────────────────────────────────────────────

export async function getResumeAnalysis(
  applicationId: string
): Promise<ResumeAnalysisRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("resume_analysis")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data ?? null;
}

export async function runResumeAnalysis(
  applicationId: string
): Promise<{ error?: string; data?: ResumeAnalysisRecord }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };

    const fetched = await fetchResumeText(supabase, applicationId, user.id);
    if ("error" in fetched) return { error: fetched.error };

    const { resumeText, resumeId, application } = fetched;

    const analysis = await AIService.analyzeResume({
      resumeText,
      jobDescription: application.job_description as string,
      companyName: application.company_name as string,
      position: application.position as string,
    });

    const { data: saved, error: saveError } = await supabase
      .from("resume_analysis")
      .insert({
        application_id: applicationId,
        resume_id: resumeId,
        resume_match: analysis.resume_match,
        ats_score: analysis.ats_score,
        matching_skills: analysis.matching_skills,
        missing_skills: analysis.missing_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        summary: analysis.summary,
        suggestions: analysis.suggestions,
        generated_cover_letter: null,
        ai_provider: "gemini",
      })
      .select()
      .single();

    if (saveError) return { error: saveError.message };

    revalidatePath(`/applications/${applicationId}`);
    return { data: saved as ResumeAnalysisRecord };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Analysis failed." };
  }
}

export async function runGenerateCoverLetter(
  applicationId: string
): Promise<{ error?: string; coverLetter?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };

    const fetched = await fetchResumeText(supabase, applicationId, user.id);
    if ("error" in fetched) return { error: fetched.error };

    const { resumeText, application } = fetched;

    const result = await AIService.generateCoverLetter({
      resumeText,
      jobDescription: application.job_description as string,
      companyName: application.company_name as string,
      position: application.position as string,
    });

    // Persist to the most recent analysis row so it survives page refreshes.
    // PostgREST doesn't support order/limit on UPDATE, so fetch the row id first.
    const { data: latest } = await supabase
      .from("resume_analysis")
      .select("id")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latest?.id) {
      await supabase
        .from("resume_analysis")
        .update({ generated_cover_letter: result.coverLetter })
        .eq("id", latest.id);
    }

    revalidatePath(`/applications/${applicationId}`);
    return { coverLetter: result.coverLetter };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Cover letter generation failed.",
    };
  }
}

export async function saveCoverLetterToApplication(
  applicationId: string,
  coverLetter: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };

    const { error } = await supabase
      .from("job_applications")
      .update({ cover_letter: coverLetter })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath(`/applications/${applicationId}`);
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
