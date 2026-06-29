"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/ai/parser";
import { AIService } from "@/lib/ai/service";
import type { ResumeATSScore } from "@/types/analysis";

/**
 * Fetches ATS scores for the given resume IDs from the database.
 * Never calls Gemini — safe to call on every page load.
 */
export async function getResumeATSScores(
  resumeIds: string[]
): Promise<Record<string, ResumeATSScore>> {
  if (!resumeIds.length) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("resume_ats_scores")
    .select("*")
    .in("resume_id", resumeIds)
    .eq("user_id", user.id);

  if (!data) return {};

  return Object.fromEntries(
    data.map((row) => [row.resume_id, row as ResumeATSScore])
  );
}

/**
 * Downloads the resume PDF, extracts text, calls Gemini, and upserts the
 * result. Only triggered by explicit user action — never called automatically.
 */
export async function runResumeATSAnalysis(
  resumeId: string
): Promise<{ error?: string; data?: ResumeATSScore }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated." };

    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, file_url")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) return { error: "Resume not found." };

    const { data: fileData, error: dlError } = await supabase.storage
      .from("resumes")
      .download(resume.file_url);

    if (dlError || !fileData) {
      return { error: "Could not download resume file. Please try again." };
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const resumeText = await extractTextFromPdf(buffer);

    const result = await AIService.analyzeResumeATS(resumeText);

    // Upsert — one row per resume, overwrite on re-analyze
    const { data: saved, error: saveError } = await supabase
      .from("resume_ats_scores")
      .upsert(
        {
          resume_id: resumeId,
          user_id: user.id,
          ats_score: result.ats_score,
          status: result.status,
        },
        { onConflict: "resume_id" }
      )
      .select()
      .single();

    if (saveError) return { error: saveError.message };

    revalidatePath("/resumes");
    return { data: saved as ResumeATSScore };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Analysis failed." };
  }
}
