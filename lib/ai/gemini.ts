import { GoogleGenAI } from "@google/genai";
import type { AIProvider, AnalysisInput, CoverLetterResult, ResumeAnalysis, ResumeATSResult } from "./types";
import { buildAnalysisPrompt, buildCoverLetterPrompt, buildResumeATSPrompt } from "./prompts";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local to enable AI features."
    );
  }
  return new GoogleGenAI({ apiKey });
}

function logResponse(label: string, raw: string, usage: unknown, finishReason: unknown) {
  console.log(`\n===== FINISH REASON (${label}) =====`);
  console.log(finishReason);
  console.log(`===== USAGE (${label}) =====`);
  const u = usage as Record<string, number> | null;
  console.log({
    promptTokenCount: u?.promptTokenCount,
    thoughtsTokenCount: u?.thoughtsTokenCount,
    candidatesTokenCount: u?.candidatesTokenCount,
    totalTokenCount: u?.totalTokenCount,
  });
  console.log(`===== RAW GEMINI (${label}) =====`);
  console.log(raw);
  console.log("=================================\n");
}

function parseAnalysisJSON(raw: string): ResumeAnalysis {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    console.error("===== JSON PARSE FAILED =====");
    console.error("Raw response:", raw);
    console.error("Parse error:", err);
    console.error("=============================");
    throw new Error(
      `Gemini returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  function clamp(n: unknown): number {
    const v = typeof n === "number" ? n : Number(n);
    return Math.min(100, Math.max(0, Math.round(isNaN(v) ? 0 : v)));
  }

  function strArr(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  }

  return {
    resume_match: clamp(parsed.resume_match),
    ats_score: clamp(parsed.ats_score),
    matching_skills: strArr(parsed.matching_skills),
    missing_skills: strArr(parsed.missing_skills),
    strengths: strArr(parsed.strengths),
    weaknesses: strArr(parsed.weaknesses),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    suggestions: strArr(parsed.suggestions),
  };
}

const VALID_STATUSES = ["Excellent", "Good", "Fair", "Poor"] as const;

function parseATSJSON(raw: string): ResumeATSResult {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    console.error("===== ATS JSON PARSE FAILED =====");
    console.error("Raw response:", raw);
    console.error("Parse error:", err);
    console.error("=================================");
    throw new Error(
      `Gemini returned invalid JSON for ATS: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const v = typeof parsed.ats_score === "number" ? parsed.ats_score : Number(parsed.ats_score);
  const ats_score = Math.min(100, Math.max(0, Math.round(isNaN(v) ? 0 : v)));

  const rawStatus = String(parsed.status ?? "");
  const status: ResumeATSResult["status"] = VALID_STATUSES.includes(
    rawStatus as ResumeATSResult["status"]
  )
    ? (rawStatus as ResumeATSResult["status"])
    : ats_score >= 90 ? "Excellent"
    : ats_score >= 75 ? "Good"
    : ats_score >= 60 ? "Fair"
    : "Poor";

  return { ats_score, status };
}

export class GeminiProvider implements AIProvider {
  private modelName: string;

  constructor(modelName = "gemini-2.5-flash") {
    this.modelName = modelName;
  }

  async analyzeResume(input: AnalysisInput): Promise<ResumeAnalysis> {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: buildAnalysisPrompt(input),
      config: {
        // thinkingBudget: 0 disables internal reasoning entirely,
        // eliminating the token exhaustion that truncates the JSON response.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        // temperature: 1 is recommended by Google when thinking is disabled.
        temperature: 1,
        maxOutputTokens: 2000,
      },
    });

    const raw = response.text ?? "";
    logResponse(
      "analysis",
      raw,
      response.usageMetadata,
      response.candidates?.[0]?.finishReason
    );

    return parseAnalysisJSON(raw);
  }

  async generateCoverLetter(input: AnalysisInput): Promise<CoverLetterResult> {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: buildCoverLetterPrompt(input),
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.9,
        maxOutputTokens: 1200,
      },
    });

    const raw = response.text?.trim() ?? "";
    logResponse(
      "cover-letter",
      raw,
      response.usageMetadata,
      response.candidates?.[0]?.finishReason
    );

    if (!raw) {
      throw new Error("Gemini returned an empty cover letter response.");
    }

    return { coverLetter: raw };
  }

  async analyzeResumeATS(resumeText: string): Promise<ResumeATSResult> {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: buildResumeATSPrompt(resumeText),
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        temperature: 1,
        // Only two fields needed — ~20 tokens. Hard ceiling prevents waste.
        maxOutputTokens: 100,
      },
    });

    const raw = response.text ?? "";
    logResponse(
      "resume-ats",
      raw,
      response.usageMetadata,
      response.candidates?.[0]?.finishReason
    );

    return parseATSJSON(raw);
  }
}
